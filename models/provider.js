module.exports = (sequelize, dataTypes) => {
    var Provider = sequelize.define('Provider', {
        provider: {
            type: dataTypes.ENUM,
            values: ['facebook', 'twitter', 'google', 'github', 'local']
          },
        providerId: {
            type: dataTypes.STRING
        },
        providerAvatar: dataTypes.STRING
    })
    Provider.associate = (models) => {
        Provider.belongsTo(models.User)
    }
    return Provider
}