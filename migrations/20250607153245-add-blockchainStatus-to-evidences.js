module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Evidences', 'blockchainStatus', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Evidences', 'blockchainStatus');
  }
};