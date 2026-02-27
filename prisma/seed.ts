import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create a sample organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo VOTORA Chapter',
      organizationType: 'VOTORA',
      cacNumber: 'CAC123456',
      primaryContactName: 'Administrator',
      primaryContactPhone: '08012345678',
      primaryContactEmail: 'admin@demo-votora.com',
      address: '123 Main Street',
      lga: 'Lagos Mainland',
      state: 'Lagos',
      subdomain: 'demo',
      status: 'Active',
    },
  });

  console.log('Created organization:', organization.name);

  // Create master admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@demo-votora.com',
      password: hashedPassword,
      role: 'MasterAdmin',
      organizationId: organization.id,
      isActive: true,
      phoneNumber: '+2348012345678', // For OTP
      otpEnabled: true,
    },
  });

  console.log('Created master admin user:', adminUser.username);
  console.log('Password: admin123');
  console.log('Phone (for OTP): +2348012345678');

  // Create sample members
  const member1 = await prisma.member.create({
    data: {
      memberId: 'MEM-20251013-0001',
      surname: 'Okafor',
      firstName: 'Chukwudi',
      middleName: 'Emmanuel',
      nin: '12345678901',
      phoneNumber: '08023456789',
      lga: 'Ikeja',
      state: 'Lagos',
      membershipStatus: 'Active',
      roleInSystem: 'Member',
      organizationId: organization.id,
    },
  });

  const member2 = await prisma.member.create({
    data: {
      memberId: 'MEM-20251013-0002',
      surname: 'Adeyemi',
      firstName: 'Blessing',
      nin: '09876543210',
      phoneNumber: '08034567890',
      lga: 'Surulere',
      state: 'Lagos',
      membershipStatus: 'Active',
      roleInSystem: 'Member',
      organizationId: organization.id,
    },
  });

  console.log('Created sample members');

  // Create sample assets
  await prisma.asset.create({
    data: {
      assetId: 'AST-20251013-0001',
      karotaNumber: 'KRT-LAG-2024-001',
      vehicleType: 'Keke',
      color: 'Yellow',
      ownerId: member1.id,
      operationalLga: 'Ikeja',
      operationalState: 'Lagos',
      vehicleStatus: 'Active',
      organizationId: organization.id,
    },
  });

  await prisma.asset.create({
    data: {
      assetId: 'AST-20251013-0002',
      karotaNumber: 'KRT-LAG-2024-002',
      vehicleType: 'Tricycle',
      color: 'Green',
      ownerId: member2.id,
      operationalLga: 'Surulere',
      operationalState: 'Lagos',
      vehicleStatus: 'Active',
      organizationId: organization.id,
    },
  });

  console.log('Created sample assets');

  console.log('\n✅ Database seeding completed!');
  console.log('\nLogin credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('Subdomain: demo\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
