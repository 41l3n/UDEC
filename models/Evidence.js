module.exports = (sequelize, DataTypes) => {
  const Evidence = sequelize.define('Evidence', {
    hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    filePointer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    addedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    blockchainId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    transactionHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    blockchainStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'evidences'
  });

  return Evidence;
};