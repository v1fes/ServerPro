'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'master', 'client'), allowNull: false, defaultValue: 'client' },
      first_name: { type: Sequelize.STRING, allowNull: false },
      last_name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: true },
      specialization: { type: Sequelize.STRING, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 2. Devices
    await queryInterface.createTable('devices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      device_type: { type: Sequelize.ENUM('phone', 'laptop', 'tablet', 'other'), allowNull: false },
      brand: { type: Sequelize.STRING, allowNull: false },
      model: { type: Sequelize.STRING, allowNull: false },
      serial_number: { type: Sequelize.STRING, allowNull: true },
      purchase_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 3. Repair Types
    await queryInterface.createTable('repair_types', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 4. Parts
    await queryInterface.createTable('parts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: true },
      compatible_device_type: { type: Sequelize.STRING, allowNull: true },
      compatible_brand: { type: Sequelize.STRING, allowNull: true },
      compatible_model: { type: Sequelize.STRING, allowNull: true },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      quantity_in_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      min_stock_level: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 5. Repair Orders
    await queryInterface.createTable('repair_orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      order_number: { type: Sequelize.STRING, unique: true, allowNull: false },
      device_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'devices', key: 'id' }, onDelete: 'CASCADE' },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      master_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      status: { type: Sequelize.ENUM('new', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'issued'), allowNull: false, defaultValue: 'new' },
      description: { type: Sequelize.TEXT, allowNull: false },
      diagnosis: { type: Sequelize.TEXT, allowNull: true },
      total_cost: { type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
      deadline: { type: Sequelize.DATE, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      photo_url: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 6. Order Status History
    await queryInterface.createTable('order_status_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repair_orders', key: 'id' }, onDelete: 'CASCADE' },
      status: { type: Sequelize.STRING, allowNull: false },
      changed_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 7. Order Parts (junction)
    await queryInterface.createTable('order_parts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repair_orders', key: 'id' }, onDelete: 'CASCADE' },
      part_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'parts', key: 'id' }, onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      price_at_use: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 8. Order Repairs (junction)
    await queryInterface.createTable('order_repairs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repair_orders', key: 'id' }, onDelete: 'CASCADE' },
      repair_type_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repair_types', key: 'id' }, onDelete: 'CASCADE' },
      cost: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 9. Predictions
    await queryInterface.createTable('predictions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      device_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'devices', key: 'id' }, onDelete: 'CASCADE' },
      predicted_failure_type: { type: Sequelize.STRING, allowNull: true },
      probability: { type: Sequelize.FLOAT, allowNull: true },
      predicted_date: { type: Sequelize.DATE, allowNull: true },
      model_version: { type: Sequelize.STRING, allowNull: true },
      source: { type: Sequelize.ENUM('ml', 'gemini', 'combined'), allowNull: false, defaultValue: 'ml' },
      gemini_analysis: { type: Sequelize.TEXT, allowNull: true },
      recommendations: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // 10. Notifications
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // Indexes
    await queryInterface.addIndex('devices', ['client_id']);
    await queryInterface.addIndex('repair_orders', ['client_id']);
    await queryInterface.addIndex('repair_orders', ['master_id']);
    await queryInterface.addIndex('repair_orders', ['status']);
    await queryInterface.addIndex('repair_orders', ['order_number']);
    await queryInterface.addIndex('order_status_history', ['order_id']);
    await queryInterface.addIndex('predictions', ['device_id']);
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('predictions');
    await queryInterface.dropTable('order_repairs');
    await queryInterface.dropTable('order_parts');
    await queryInterface.dropTable('order_status_history');
    await queryInterface.dropTable('repair_orders');
    await queryInterface.dropTable('parts');
    await queryInterface.dropTable('repair_types');
    await queryInterface.dropTable('devices');
    await queryInterface.dropTable('users');
  },
};
