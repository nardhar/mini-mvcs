const path = require('path');

const env = process.env.NODE_ENV || 'development';

module.exports = (appPath) => {
  const config = require(path.resolve((appPath), 'config'))[env];
  return Object.assign({}, config, { appPath });
};
