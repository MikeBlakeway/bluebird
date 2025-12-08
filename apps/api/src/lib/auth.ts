import { randomBytes } from 'crypto';
import { prisma } from './db.js';

const MAGIC_LINK_EXPIRY_HOURS = 24;

/**
 * Generate a magic link token and store it in the database.
 * Allows users to sign in without a password.
 */
export async function generateMagicLink(email: string) {
  // Clean up any expired magic links for this email
  await prisma.magicLink.deleteMany({
    where: {
      user: { email },
      expiresAt: { lt: new Date() },
    },
  });

  // Check if user exists, create if not
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email },
    });
  }

  // Generate a secure random token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete any existing magic link for this user
  await prisma.magicLink.deleteMany({
    where: { userId: user.id },
  });

  // Create new magic link
  await prisma.magicLink.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Verify a magic link token and sign the user in.
 */
export async function verifyMagicLink(token: string) {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!magicLink) {
    throw new Error('Invalid or expired magic link');
  }

  if (magicLink.used) {
    throw new Error('Magic link has already been used');
  }

  if (magicLink.expiresAt < new Date()) {
    throw new Error('Magic link has expired');
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { used: true },
  });

  return magicLink.user;
}
