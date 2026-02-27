import { PrismaClient } from '@prisma/client';
import { verifyToken, JWTPayload } from '../utils/auth';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  user: JWTPayload | null;
  ip: string;
}

export const context = async ({ req }: any): Promise<Context> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let user: JWTPayload | null = null;

  if (token) {
    try {
      user = verifyToken(token);
    } catch {
      // Token invalid or expired - user remains null
    }
  }

  const ip = req.ip || req.connection.remoteAddress || '';

  return {
    prisma,
    user,
    ip,
  };
};

export const requireAuth = (context: Context) => {
  if (!context.user) {
    throw new Error('Not authenticated');
  }
  return context.user;
};
