const path = require('path');

const env = process.env.NODE_ENV || 'development';

module.exports = (appPath) => {
  const config = require(path.resolve((appPath), 'config'))[env];
  const configDatabase = Object.assign({}, config.database || {}, {
    sync: { force: process.env.FORCE || config.database.sync.force },
  });

  return Object.assign({}, config, { appPath, database: configDatabase });
};
