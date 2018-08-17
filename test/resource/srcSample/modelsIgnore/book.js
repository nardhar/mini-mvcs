module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    name: DataTypes.STRING(255),
    description: DataTypes.STRING(255),
  });

  Book.associate = (models) => {
    models.Book.belongsTo(models.Author);
  };

  return Book;
};
