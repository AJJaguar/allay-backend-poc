import { PrismaClient } from '@prisma/client';

/**
 * OTP Management for MFA and Password Reset
 *
 * NOTE: This uses console.log for OTP delivery in development.
 * In production, integrate with SMS provider:
 * - Twilio: https://www.twilio.com
 * - Africa's Talking: https://africastalking.com (recommended for Nigeria)
 * - Termii: https://termii.com (Nigerian SMS provider)
 */

const OTP_EXPIRY_MINUTES = 10;
const MAX_PASSWORD_HISTORY = 5;

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOTP = async (
  prisma: PrismaClient,
  phoneNumber: string,
  type: 'LOGIN' | 'RESET_PASSWORD',
  userId?: string
) => {
  const token = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing OTPs for this phone/type
  await prisma.oTPToken.updateMany({
    where: {
      phoneNumber,
      type,
      verified: false,
    },
    data: {
      verified: true, // Mark as used
    },
  });

  // Create new OTP
  const otp = await prisma.oTPToken.create({
    data: {
      phoneNumber,
      token,
      type,
      expiresAt,
      userId,
    },
  });

  // Send OTP via SMS (console.log in dev)
  await sendOTP(phoneNumber, token, type);

  return otp;
};

export const verifyOTP = async (
  prisma: PrismaClient,
  phoneNumber: string,
  token: string,
  type: 'LOGIN' | 'RESET_PASSWORD'
): Promise<boolean> => {
  const otp = await prisma.oTPToken.findFirst({
    where: {
      phoneNumber,
      token,
      type,
      verified: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otp) {
    return false;
  }

  // Mark as verified
  await prisma.oTPToken.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return true;
};

export const sendOTP = async (
  phoneNumber: string,
  token: string,
  type: 'LOGIN' | 'RESET_PASSWORD'
): Promise<void> => {
  const message =
    type === 'LOGIN'
      ? `Your login OTP is: ${token}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      : `Your password reset OTP is: ${token}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

  // DEVELOPMENT: Log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📱 SMS Simulation:');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('');
    return;
  }

  // PRODUCTION: Integrate SMS provider
  // Example with Africa's Talking (recommended for Nigeria)
  /*
  const africastalking = require('africastalking')({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
  });

  await africastalking.SMS.send({
    to: phoneNumber,
    message: message,
  });
  */

  // Example with Termii (Nigerian provider)
  /*
  const response = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: phoneNumber,
      from: 'TransportApp',
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: process.env.TERMII_API_KEY,
    }),
  });
  */

  console.warn('⚠️  SMS not configured. OTP not sent to:', phoneNumber);
};

export const checkPasswordHistory = async (
  prisma: PrismaClient,
  userId: string,
  newPasswordHash: string
): Promise<boolean> => {
  const bcrypt = require('bcryptjs');

  // Get last N passwords
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: MAX_PASSWORD_HISTORY,
  });

  // Check if new password matches any in history
  for (const record of history) {
    const matches = await bcrypt.compare(newPasswordHash, record.password);
    if (matches) {
      return false; // Password was used before
    }
  }

  return true; // Password is new
};

export const addPasswordToHistory = async (
  prisma: PrismaClient,
  userId: string,
  passwordHash: string
): Promise<void> => {
  await prisma.passwordHistory.create({
    data: {
      userId,
      password: passwordHash,
    },
  });

  // Keep only last MAX_PASSWORD_HISTORY entries
  const allHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (allHistory.length > MAX_PASSWORD_HISTORY) {
    const toDelete = allHistory.slice(MAX_PASSWORD_HISTORY);
    await prisma.passwordHistory.deleteMany({
      where: {
        id: {
          in: toDelete.map((h) => h.id),
        },
      },
    });
  }
};
