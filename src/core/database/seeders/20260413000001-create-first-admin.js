const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Generate a secure hashed password
    const passwordHash = await bcrypt.hash('Admin@1234', 10);
    const adminId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@mksab.com',
        full_name: 'Mksab Admin',
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('\n======================================');
    console.log('✅ FIRST ADMIN SEEDED SUCCESSFULLY');
    console.log('Email: admin@mksab.com');
    console.log('Password: Admin@1234');
    console.log('======================================\n');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@mksab.com' }, {});
  },
};
