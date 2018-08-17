module.exports = (sequelize, DataTypes) => {
  const Author = sequelize.define('Author', {
    name: DataTypes.STRING(255),
    lastName: DataTypes.TEXT,
  });

  Author.associate = (models) => {
    models.Author.hasMany(models.Book);
  };

  return Author;
};
