const path = require('path');
const { Op } = require('sequelize');

const env = process.env.NODE_ENV || 'development';

module.exports = (appPath) => {
  const config = require(path.resolve(appPath, 'config'))[env] || {};
  const configDatabase = config.database || {};
  const configDatabaseSync = configDatabase.sync || {};

  const database = Object.assign({}, configDatabase, {
    sync: { force: process.env.FORCE || configDatabaseSync.force },
    operatorsAliases: Op,
  });

  return Object.assign({}, config, { appPath, database });
};
