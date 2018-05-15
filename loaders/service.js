const models = require('./model');
const fileUtil = require('../util/file');
const config = require('./config');

const services = {};

// load the app services
fileUtil.loaddirSync(
  config.service.dir || `${__dirname}/../../../services`,
  config.service.suffix || '.service.js',
  config.service.ignore || [],
  (err, file, filePath) => {
    const serviceName = fileUtil.normalizeName(file.substr(0, file.indexOf('.')));
    services[serviceName] = require(filePath.substr(0, filePath.lastIndexOf('.')))(services, models);
  },
);

module.exports = services;
