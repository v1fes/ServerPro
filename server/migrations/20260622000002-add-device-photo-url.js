'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const devicesTable = await queryInterface.describeTable('devices');
    if (!devicesTable.photo_url) {
      await queryInterface.addColumn('devices', 'photo_url', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const devicesTable = await queryInterface.describeTable('devices');
    if (devicesTable.photo_url) {
      await queryInterface.removeColumn('devices', 'photo_url');
    }
  },
};
