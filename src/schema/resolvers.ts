import { Context, requireAuth } from '../middleware/context';
import { generateToken, comparePassword, hashPassword } from '../utils/auth';
import { encryptMemberData, decryptMemberData } from '../utils/encryption';
import { generateMemberId, generateAssetId } from '../utils/generators';
import {
  createOTP,
  verifyOTP,
  checkPasswordHistory,
  addPasswordToHistory,
} from '../utils/otp';

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      const user = requireAuth(context);
      return context.prisma.user.findUnique({
        where: { id: user.userId },
        include: { organization: true },
      });
    },

    dashboardStats: async (_: any, __: any, context: Context) => {
      const user = requireAuth(context);

      const [
        totalMembers,
        activeMembers,
        suspendedMembers,
        inactiveMembers,
        totalAssets,
        activeAssets,
        maintenanceAssets,
        retiredAssets,
      ] = await Promise.all([
        context.prisma.member.count({
          where: { organizationId: user.organizationId },
        }),
        context.prisma.member.count({
          where: {
            organizationId: user.organizationId,
            membershipStatus: 'Active',
          },
        }),
        context.prisma.member.count({
          where: {
            organizationId: user.organizationId,
            membershipStatus: 'Suspended',
          },
        }),
        context.prisma.member.count({
          where: {
            organizationId: user.organizationId,
            membershipStatus: 'Inactive',
          },
        }),
        context.prisma.asset.count({
          where: { organizationId: user.organizationId },
        }),
        context.prisma.asset.count({
          where: {
            organizationId: user.organizationId,
            vehicleStatus: 'Active',
          },
        }),
        context.prisma.asset.count({
          where: {
            organizationId: user.organizationId,
            vehicleStatus: 'Maintenance',
          },
        }),
        context.prisma.asset.count({
          where: {
            organizationId: user.organizationId,
            vehicleStatus: 'Retired',
          },
        }),
      ]);

      return {
        members: {
          total: totalMembers,
          active: activeMembers,
          suspended: suspendedMembers,
          inactive: inactiveMembers,
        },
        assets: {
          total: totalAssets,
          active: activeAssets,
          maintenance: maintenanceAssets,
          retired: retiredAssets,
        },
      };
    },

    members: async (
      _: any,
      { page = 1, limit = 20, search, status }: any,
      context: Context
    ) => {
      const user = requireAuth(context);
      const skip = (page - 1) * limit;

      const where: any = { organizationId: user.organizationId };

      if (search) {
        where.OR = [
          { surname: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { memberId: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search } },
        ];
      }

      if (status) {
        where.membershipStatus = status;
      }

      const [members, total] = await Promise.all([
        context.prisma.member.findMany({
          where,
          skip,
          take: limit,
          include: { assets: true, organization: true },
          orderBy: { createdAt: 'desc' },
        }),
        context.prisma.member.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: members.map(decryptMemberData),
        pagination: {
          total,
          totalPages,
          currentPage: page,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    },

    member: async (_: any, { id }: any, context: Context) => {
      const user = requireAuth(context);
      const member = await context.prisma.member.findFirst({
        where: { id, organizationId: user.organizationId },
        include: { assets: true, organization: true },
      });
      return member ? decryptMemberData(member) : null;
    },

    memberByMemberId: async (_: any, { memberId }: any, context: Context) => {
      const user = requireAuth(context);
      const member = await context.prisma.member.findFirst({
        where: { memberId, organizationId: user.organizationId },
        include: { assets: true, organization: true },
      });
      return member ? decryptMemberData(member) : null;
    },

    assets: async (
      _: any,
      { page = 1, limit = 20, search, status }: any,
      context: Context
    ) => {
      const user = requireAuth(context);
      const skip = (page - 1) * limit;

      const where: any = { organizationId: user.organizationId };

      if (search) {
        where.OR = [
          { karotaNumber: { contains: search, mode: 'insensitive' } },
          { plateNumber: { contains: search, mode: 'insensitive' } },
          { assetId: { contains: search, mode: 'insensitive' } },
          { owner: { surname: { contains: search, mode: 'insensitive' } } },
          { owner: { firstName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where.vehicleStatus = status;
      }

      const [assets, total] = await Promise.all([
        context.prisma.asset.findMany({
          where,
          skip,
          take: limit,
          include: { owner: true, organization: true },
          orderBy: { createdAt: 'desc' },
        }),
        context.prisma.asset.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: assets,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    },

    asset: async (_: any, { id }: any, context: Context) => {
      const user = requireAuth(context);
      return context.prisma.asset.findFirst({
        where: { id, organizationId: user.organizationId },
        include: { owner: true, organization: true },
      });
    },

    assetByKarotaNumber: async (
      _: any,
      { karotaNumber }: any,
      context: Context
    ) => {
      const user = requireAuth(context);
      return context.prisma.asset.findFirst({
        where: { karotaNumber, organizationId: user.organizationId },
        include: { owner: true, organization: true },
      });
    },
  },

  Mutation: {
    login: async (_: any, { username, password }: any, context: Context) => {
      const user = await context.prisma.user.findUnique({
        where: { username },
        include: { organization: true },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Check if OTP is enabled
      if (user.otpEnabled && user.phoneNumber) {
        // Send OTP
        await createOTP(context.prisma, user.phoneNumber, 'LOGIN', user.id);

        return {
          token: '', // Don't send token yet
          user,
          requiresOTP: true,
        };
      }

      // No OTP required, proceed with login
      await context.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          organizationId: user.organizationId,
          ipAddress: context.ip,
        },
      });

      const token = generateToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      });

      return { token, user, requiresOTP: false };
    },

    verifyOTP: async (_: any, { username, otp }: any, context: Context) => {
      const user = await context.prisma.user.findUnique({
        where: { username },
        include: { organization: true },
      });

      if (!user || !user.phoneNumber) {
        throw new Error('Invalid request');
      }

      const valid = await verifyOTP(
        context.prisma,
        user.phoneNumber,
        otp,
        'LOGIN'
      );

      if (!valid) {
        throw new Error('Invalid or expired OTP');
      }

      // Update last login
      await context.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          organizationId: user.organizationId,
          ipAddress: context.ip,
        },
      });

      const token = generateToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      });

      return { token, user, requiresOTP: false };
    },

    requestPasswordReset: async (
      _: any,
      { phoneNumber }: any,
      context: Context
    ) => {
      // Find user by phone number
      const user = await context.prisma.user.findFirst({
        where: { phoneNumber },
      });

      if (!user) {
        // Don't reveal if user exists
        return {
          success: true,
          message: 'If this number is registered, you will receive an OTP',
        };
      }

      // Send OTP
      await createOTP(context.prisma, phoneNumber, 'RESET_PASSWORD', user.id);

      return {
        success: true,
        message: 'OTP sent to your phone number',
      };
    },

    resetPassword: async (
      _: any,
      { phoneNumber, otp, newPassword }: any,
      context: Context
    ) => {
      // Verify OTP
      const valid = await verifyOTP(
        context.prisma,
        phoneNumber,
        otp,
        'RESET_PASSWORD'
      );

      if (!valid) {
        throw new Error('Invalid or expired OTP');
      }

      // Find user
      const user = await context.prisma.user.findFirst({
        where: { phoneNumber },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Check password history
      const isNewPassword = await checkPasswordHistory(
        context.prisma,
        user.id,
        newPassword
      );

      if (!isNewPassword) {
        throw new Error(
          `Password was used recently. Please use a different password. (Last 5 passwords cannot be reused)`
        );
      }

      // Update password
      await context.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Add to password history
      await addPasswordToHistory(context.prisma, user.id, hashedPassword);

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          organizationId: user.organizationId,
          details: 'Password reset via OTP',
          ipAddress: context.ip,
        },
      });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    },

    changePassword: async (
      _: any,
      { currentPassword, newPassword }: any,
      context: Context
    ) => {
      const authUser = requireAuth(context);

      const user = await context.prisma.user.findUnique({
        where: { id: authUser.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) {
        throw new Error('Current password is incorrect');
      }

      // Check password history
      const isNewPassword = await checkPasswordHistory(
        context.prisma,
        user.id,
        newPassword
      );

      if (!isNewPassword) {
        throw new Error(
          `Password was used recently. Please use a different password. (Last 5 passwords cannot be reused)`
        );
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await context.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Add to password history
      await addPasswordToHistory(context.prisma, user.id, hashedPassword);

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          organizationId: user.organizationId,
          details: 'Password changed',
          ipAddress: context.ip,
        },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    },

    createMember: async (_: any, { input }: any, context: Context) => {
      const user = requireAuth(context);

      // Generate unique member ID
      const memberId = await generateMemberId(
        context.prisma,
        user.organizationId
      );

      // Encrypt sensitive data
      const encryptedData = encryptMemberData(input);

      const member = await context.prisma.member.create({
        data: {
          ...encryptedData,
          memberId,
          organizationId: user.organizationId,
          createdBy: user.userId,
          dateJoined: input.dateJoined
            ? new Date(input.dateJoined)
            : new Date(),
        },
        include: { assets: true, organization: true },
      });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'Member',
          entityId: member.id,
          userId: user.userId,
          organizationId: user.organizationId,
          details: JSON.stringify({ memberId: member.memberId }),
          ipAddress: context.ip,
        },
      });

      return decryptMemberData(member);
    },

    updateMember: async (_: any, { id, input }: any, context: Context) => {
      const user = requireAuth(context);

      // Verify member belongs to organization
      const existing = await context.prisma.member.findFirst({
        where: { id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new Error('Member not found');
      }

      const encryptedData = encryptMemberData(input);

      const member = await context.prisma.member.update({
        where: { id },
        data: encryptedData,
        include: { assets: true, organization: true },
      });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Member',
          entityId: member.id,
          userId: user.userId,
          organizationId: user.organizationId,
          details: JSON.stringify(input),
          ipAddress: context.ip,
        },
      });

      return decryptMemberData(member);
    },

    deleteMember: async (_: any, { id }: any, context: Context) => {
      const user = requireAuth(context);

      const existing = await context.prisma.member.findFirst({
        where: { id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new Error('Member not found');
      }

      await context.prisma.member.delete({ where: { id } });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'Member',
          entityId: id,
          userId: user.userId,
          organizationId: user.organizationId,
          ipAddress: context.ip,
        },
      });

      return true;
    },

    createAsset: async (_: any, { input }: any, context: Context) => {
      const user = requireAuth(context);

      // Generate unique asset ID
      const assetId = await generateAssetId(
        context.prisma,
        user.organizationId
      );

      // Verify owner exists and belongs to organization
      const owner = await context.prisma.member.findFirst({
        where: { id: input.ownerId, organizationId: user.organizationId },
      });

      if (!owner) {
        throw new Error('Owner not found');
      }

      const asset = await context.prisma.asset.create({
        data: {
          ...input,
          assetId,
          organizationId: user.organizationId,
          createdBy: user.userId,
        },
        include: { owner: true, organization: true },
      });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'Asset',
          entityId: asset.id,
          userId: user.userId,
          organizationId: user.organizationId,
          details: JSON.stringify({ assetId: asset.assetId }),
          ipAddress: context.ip,
        },
      });

      return asset;
    },

    updateAsset: async (_: any, { id, input }: any, context: Context) => {
      const user = requireAuth(context);

      const existing = await context.prisma.asset.findFirst({
        where: { id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new Error('Asset not found');
      }

      const asset = await context.prisma.asset.update({
        where: { id },
        data: input,
        include: { owner: true, organization: true },
      });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Asset',
          entityId: asset.id,
          userId: user.userId,
          organizationId: user.organizationId,
          details: JSON.stringify(input),
          ipAddress: context.ip,
        },
      });

      return asset;
    },

    deleteAsset: async (_: any, { id }: any, context: Context) => {
      const user = requireAuth(context);

      const existing = await context.prisma.asset.findFirst({
        where: { id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new Error('Asset not found');
      }

      await context.prisma.asset.delete({ where: { id } });

      // Log audit
      await context.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'Asset',
          entityId: id,
          userId: user.userId,
          organizationId: user.organizationId,
          ipAddress: context.ip,
        },
      });

      return true;
    },
  },
};
