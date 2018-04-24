const models = require('./model');
const fileUtil = require('../util/file');

const services = {};

// carga los servicios
fileUtil.loaddirSync(
  config.service.dir || '../../../services',
  config.service.suffix || '.service.js',
  config.service.ignore || [],
  (err, file, filePath) => {
    const serviceName = fileUtil.normalizeName(file.substr(0, file.indexOf('.')));
    services[serviceName] = require(filePath.substr(0, filePath.lastIndexOf('.')))(services, models);
  },
);

module.exports = services;
