
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Providers',
      'UserId', 
      {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    ).then(() => {
      return queryInterface.addColumn()
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Providers',
      'UserId'
    )
  }
}
