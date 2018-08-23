const { sep } = require('path');

const capitalize = (text) => {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

class Model {
  constructor(filePath) {
    const fileParts = filePath.split(sep);
    const name = fileParts[fileParts.length - 1];
    this.name = capitalize(name.split('.')[0]);
    this.belongsToModels = [];
    this.hasOneModels = [];
    this.belongsToManyModels = [];
    this.hasManyModels = [];
    if (this.name === 'Book') {
      this.associate = (models) => {
        models.Book.belongsTo(models.Author, { as: 'author' });
        models.Book.belongsToMany(models.Tag, { as: 'bookTags' });
        models.Book.hasOne(models.Isbn, { as: 'isbn' });
      };
    }
    if (this.name === 'Author') {
      this.associate = (models) => {
        models.Author.hasMany(models.Book, { as: 'books' });
      };
    }
    if (this.name === 'Tag') {
      this.associate = (models) => {
        models.Tag.belongsToMany(models.Book, { as: 'bookTags' });
      };
    }
    if (this.name === 'Isbn') {
      this.associate = (models) => {
        models.Isbn.belongsTo(models.Book, { as: 'book' });
      };
    }
  }

  belongsTo(model, options) {
    this.belongsToModels.push({ model, options });
  }

  hasOne(model, options) {
    this.hasOneModels.push({ model, options });
  }

  belongsToMany(model, options) {
    this.belongsToManyModels.push({ model, options });
  }

  hasMany(model, options) {
    this.hasManyModels.push({ model, options });
  }
}

class Sequelize {
  constructor(database, username, password, options) {
    this.database = database;
    this.username = username;
    this.password = password;
    this.options = options;
    this.models = [];
  }

  import(modelPath) {
    const importedModel = new Model(modelPath);
    this.models.push(importedModel);
    return importedModel;
  }
}

module.exports = Sequelize;
