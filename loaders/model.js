const path = require('path');
const Sequelize = require('sequelize');
const config = require('./config');
const fileUtil = require('../util/file');

const db = {};

const sequelize = config.database.use_env_variable
  ? new Sequelize(process.env[config.database.use_env_variable], config.database.database)
  : new Sequelize(config.database.database, config.database.username, config.database.password, config.database);

fileUtil.loaddirSync(
  config.model.dir || `${__dirname}/../../../models`,
  config.model.suffix || '.js',
  config.model.ignore || [],
  (err, file, filePath) => {
    const model = sequelize['import'](filePath);
    db[model.name] = model;
  },
);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
