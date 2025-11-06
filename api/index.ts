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
    res.status(status).json({ message });
  });

  // Note: Static files are served by Vercel automatically, so we don't need serveStatic here
  
  appInstance = app;
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
  // Get the original path from Vercel
  // Vercel preserves the original path in various headers
  const originalPath = (req.headers['x-vercel-rewrite-path'] as string) || 
                       (req.headers['x-invoke-path'] as string) || 
                       req.url || '';
  
  // Extract path and query string
  const [path, queryString] = originalPath.split('?');
  const fullPath = path || '/';
  
  // Ensure path starts with /api for Express routes
  const expressPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;
  
  // Create Express-compatible request object
  const expressReq = {
    method: req.method || 'GET',
    url: expressPath + (queryString ? `?${queryString}` : ''),
    originalUrl: expressPath + (queryString ? `?${queryString}` : ''),
    path: expressPath,
    query: req.query || {},
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
        res.status(404).json({ error: 'Route not found' });
        responseSent = true;
      }
      resolve();
    });
  });
}

