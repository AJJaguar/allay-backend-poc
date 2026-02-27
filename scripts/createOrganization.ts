/**
 * Script to create a new organization with master admin user
 *
 * Usage:
 * npx ts-node scripts/createOrganization.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createOrganization() {
  console.log('\n=== Create New Organization ===\n');

  try {
    // Collect organization details
    const name = await question('Organization Name: ');
    const organizationType = await question(
      'Organization Type (VOTORA/KAROTA/Other): '
    );
    const cacNumber = await question('CAC Registration Number (optional): ');
    const primaryContactName = await question('Primary Contact Name: ');
    const primaryContactPhone = await question('Primary Contact Phone: ');
    const primaryContactEmail = await question(
      'Primary Contact Email (optional): '
    );
    const address = await question('Physical Address: ');
    const lga = await question('Local Government Area: ');
    const state = await question('State: ');
    const subdomain = await question('Subdomain (e.g., lagos-votora): ');

    // Check if subdomain already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { subdomain },
    });

    if (existingOrg) {
      console.error('\n❌ Error: Subdomain already exists!');
      rl.close();
      return;
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        organizationType,
        cacNumber: cacNumber || null,
        primaryContactName,
        primaryContactPhone,
        primaryContactEmail: primaryContactEmail || null,
        address,
        lga,
        state,
        subdomain,
        status: 'Active',
      },
    });

    console.log('\n✅ Organization created successfully!');
    console.log(`ID: ${organization.id}`);
    console.log(`Subdomain: ${organization.subdomain}`);

    // Create master admin user
    const username = await question('\nMaster Admin Username: ');
    const email = await question('Master Admin Email (optional): ');
    const password = await question('Master Admin Password: ');

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        role: 'MasterAdmin',
        organizationId: organization.id,
        isActive: true,
      },
    });

    console.log('\n✅ Master admin user created successfully!');
    console.log(`Username: ${adminUser.username}`);
    console.log('\n=== Organization Setup Complete ===\n');
    console.log('Login credentials:');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: ${password}`);
    console.log(`Subdomain: ${organization.subdomain}`);
    console.log('\n⚠️  Please save these credentials securely!\n');
  } catch (error) {
    console.error('\n❌ Error creating organization:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createOrganization();
