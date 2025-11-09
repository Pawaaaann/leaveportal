import { createHmac, randomBytes } from "node:crypto";

const SECRET_KEY = process.env.GUARDIAN_TOKEN_SECRET || "default-secret-key-change-in-production";
const TOKEN_EXPIRY_HOURS = 24; // 24 hours expiry for guardian approval

export function generateGuardianToken(leaveRequestId: string, guardianPhone: string): {
  token: string;
  expiresAt: string;
} {
  const timestamp = Date.now();
  const expiryTime = timestamp + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  // Create a random nonce for security
  const nonce = randomBytes(16).toString('hex');
  
  // Create token payload
  const payload = `${leaveRequestId}:${guardianPhone}:${expiryTime}:${nonce}`;
  
  // Generate HMAC signature
  const signature = createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  // Combine payload and signature
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  
  return {
    token,
    expiresAt: new Date(expiryTime).toISOString()
  };
}

export function verifyGuardianToken(token: string, leaveRequestId: string, guardianPhone: string): {
  valid: boolean;
  expired?: boolean;
  error?: string;
} {
  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    
    if (parts.length !== 5) {
      return { valid: false, error: "Invalid token format" };
    }
    
    const [tokenLeaveId, tokenPhone, tokenExpiry, nonce, signature] = parts;
    
    // Verify the data matches
    if (tokenLeaveId !== leaveRequestId || tokenPhone !== guardianPhone) {
      return { valid: false, error: "Token does not match request" };
    }
    
    // Check if token is expired
    const expiryTime = parseInt(tokenExpiry);
    if (Date.now() > expiryTime) {
      return { valid: false, expired: true, error: "Token has expired" };
    }
    
    // Verify signature
    const payload = `${tokenLeaveId}:${tokenPhone}:${tokenExpiry}:${nonce}`;
    const expectedSignature = createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid token signature" };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Token verification failed" };
  }
}

export function generateGuardianApprovalLink(leaveRequestId: string, token: string): string {
  // Use Vercel URL if available, otherwise fall back to BASE_URL or localhost
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/guardian-approve/${leaveRequestId}?token=${encodeURIComponent(token)}`;
}