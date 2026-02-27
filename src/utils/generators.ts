import { PrismaClient } from '@prisma/client';

export const generateMemberId = async (
  prisma: PrismaClient,
  organizationId: string
): Promise<string> => {
  // Generate format: MEM-YYYYMMDD-XXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Get count of members created today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const count = await prisma.member.count({
    where: {
      organizationId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `MEM-${dateStr}-${sequence}`;
};

export const generateAssetId = async (
  prisma: PrismaClient,
  organizationId: string
): Promise<string> => {
  // Generate format: AST-YYYYMMDD-XXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const count = await prisma.asset.count({
    where: {
      organizationId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `AST-${dateStr}-${sequence}`;
};
