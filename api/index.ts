import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';

// Create Express app instance (singleton pattern for Vercel)
let appInstance: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (appInstance) {
    return appInstance;
  }

  const app = express();
  
  // Add CORS headers for all requests
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow requests from same origin and common Vercel deployment patterns
    if (origin || req.headers.host) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        console.log(logLine);
      }
    });

    next();
  });

  // Register all routes
  await registerRoutes(app);
  
  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Express error handler:', err);
    res.status(status).json({ error: message });
  });

  // Note: Static files are served by Vercel automatically, so we don't need serveStatic here
  
  appInstance = app;
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    
    // When Vercel rewrites /api/* to /api/index?path=*, the original path is in the query
    // We've configured vercel.json to pass the path as a query parameter
    let originalPath = '';
    
    // First, try to get the path from the query parameter (from our rewrite rule)
    // This handles: /api/users/login -> /api/index?path=users/login
    if (req.query && typeof req.query.path === 'string') {
      // Reconstruct the full API path
      originalPath = `/api/${req.query.path}`;
    } else if (req.query && Array.isArray(req.query.path) && req.query.path.length > 0) {
      // Handle array case (shouldn't happen, but be safe)
      originalPath = `/api/${req.query.path[0]}`;
    } else {
      // Fallback: try to get from URL or headers
      originalPath = req.url || '';
      
      // Try to get the original path from Vercel headers
      if (req.headers['x-vercel-original-path']) {
        originalPath = req.headers['x-vercel-original-path'] as string;
      } else if (req.headers['x-invoke-path']) {
        originalPath = req.headers['x-invoke-path'] as string;
      }
    }
    
    // If we still don't have a path, try to extract from URL
    if (!originalPath || originalPath === '/api/index' || originalPath.startsWith('/api/index?')) {
      // Try to parse the URL to get the path parameter
      try {
        const urlString = req.url || '/api';
        // If it's already a full URL, use it; otherwise construct one
        let urlObj: URL;
        if (urlString.startsWith('http')) {
          urlObj = new URL(urlString);
        } else {
          const host = req.headers.host || 'localhost';
          const protocol = req.headers['x-forwarded-proto'] || 'https';
          urlObj = new URL(urlString, `${protocol}://${host}`);
        }
        const pathParam = urlObj.searchParams.get('path');
        if (pathParam) {
          originalPath = `/api/${pathParam}`;
        } else {
          // Last resort: try to extract from the URL path itself
          const urlPath = urlObj.pathname;
          if (urlPath && urlPath !== '/api/index') {
            originalPath = urlPath;
          } else {
            originalPath = '/api';
          }
        }
      } catch (e) {
        // If URL parsing fails, use a default
        console.warn('Failed to parse URL:', req.url, e);
        originalPath = '/api';
      }
    }
    
    // Extract path and query string
    const [path, queryString] = originalPath.split('?');
    const fullPath = path || '/api';
    
    // Ensure path starts with /api for Express routes
    const expressPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;
    
    // Merge query parameters (excluding the 'path' parameter we used for routing)
    const query: Record<string, string> = {};
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (key !== 'path') { // Don't include our routing parameter
          query[key] = typeof req.query[key] === 'string' ? req.query[key] as string : String(req.query[key]);
        }
      });
    }
    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        if (key !== 'path') { // Don't include our routing parameter
          query[key] = value;
        }
      });
    }
    
    // Create Express-compatible request object
    const expressReq = {
      method: req.method || 'GET',
      url: expressPath + (queryString ? `?${queryString}` : ''),
      originalUrl: expressPath + (queryString ? `?${queryString}` : ''),
      path: expressPath,
      query: query,
      headers: req.headers || {},
      body: req.body,
      params: {},
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || '',
      protocol: (req.headers['x-forwarded-proto'] as string) || 'https',
      secure: true,
      hostname: (req.headers.host as string) || '',
      get: (name: string) => req.headers[name.toLowerCase()],
    } as any;

    // Create Express-compatible response object
    let responseSent = false;
    const expressRes = {
      statusCode: 200,
      status: function(code: number) {
        this.statusCode = code;
        res.status(code);
        return this;
      },
      json: function(body: any) {
        if (!responseSent) {
          res.json(body);
          responseSent = true;
        }
        return this;
      },
      send: function(body: any) {
        if (!responseSent) {
          res.send(body);
          responseSent = true;
        }
        return this;
      },
      end: function(body?: any) {
        if (!responseSent) {
          if (body) {
            res.send(body);
          } else {
            res.end();
          }
          responseSent = true;
        }
        return this;
      },
      setHeader: function(name: string, value: string | string[]) {
        res.setHeader(name, value);
        return this;
      },
      redirect: function(url: string) {
        if (!responseSent) {
          res.redirect(url);
          responseSent = true;
        }
        return this;
      },
      headersSent: false,
      getHeader: (name: string) => res.getHeader(name),
    } as any;

    // Handle the request
    return new Promise<void>((resolve) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!responseSent) {
          res.status(504).json({ error: 'Request timeout' });
          responseSent = true;
          resolve();
        }
      }, 25000); // 25 seconds (less than Vercel's 30s limit)

      // Process request through Express
      app(expressReq, expressRes, (err?: any) => {
        clearTimeout(timeout);
        if (err && !responseSent) {
          console.error('Express error:', err);
          res.status(500).json({ error: err.message || 'Internal server error' });
          responseSent = true;
        }
        if (!responseSent) {
          res.status(404).json({ error: 'Route not found', path: expressPath });
          responseSent = true;
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
  }
}

