// Utility script to check and display user mustChangePassword status
import { prisma } from '../prisma';

async function checkUsers() {
  try {
    console.log('Checking all users in the database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        invitedBy: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);

    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Must Change Password: ${user.mustChangePassword}`);
      console.log(`   - Invited By: ${user.invitedBy || 'Self-registered'}`);
      console.log(`   - Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Check for users that might need mustChangePassword set
    const invitedUsersWithoutFlag = users.filter(
      (u: any) => u.invitedBy !== null && u.mustChangePassword === false
    );

    if (invitedUsersWithoutFlag.length > 0) {
      console.log('\n⚠️  WARNING: Found invited users without mustChangePassword flag:');
      invitedUsersWithoutFlag.forEach((user: any) => {
        console.log(`   - ${user.name} (${user.email})`);
      });
      console.log('\nThese users should have mustChangePassword: true');
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
