import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRY = '7d';

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user.
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as JoseJWTPayload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

/**
 * Verify a JWT token and extract the payload.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
