process.env.NODE_ENV = 'test';
require('dotenv').config();
const app = require('../app');
const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

let server;

const testUser = {
  email: 'test@test.com',
  password: 'test123456',
  firstName: 'Test',
  lastName: 'User',
};

const testAdmin = {
  email: 'admin@test.com',
  password: 'admin123456',
  firstName: 'Admin',
  lastName: 'Test',
};

const setupTestDB = async () => {
  await sequelize.sync({ force: true });

  // Create admin user
  const passwordHash = await bcrypt.hash(testAdmin.password, 12);
  await User.create({
    email: testAdmin.email,
    passwordHash,
    firstName: testAdmin.firstName,
    lastName: testAdmin.lastName,
    role: 'admin',
  });
};

const teardownTestDB = async () => {
  await sequelize.close();
};

module.exports = {
  app,
  sequelize,
  setupTestDB,
  teardownTestDB,
  testUser,
  testAdmin,
};
