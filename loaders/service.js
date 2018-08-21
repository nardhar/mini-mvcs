const path = require('path');
const { loaddirSync, normalizeName } = require('../util/file');

module.exports = (config, models) => {
  const services = {};

  // load the app services
  const configService = config.service || {};
  loaddirSync(
    path.resolve(config.appPath, configService.dir || './services'),
    `${configService.suffix || '.service'}.js`,
    configService.ignore || [],
  )
  // using a forEach because we need the same services object as a parameter for each object member
  .forEach((serviceFile) => {
    const serviceName = normalizeName(serviceFile.file.substr(0, serviceFile.file.indexOf('.')));
    services[serviceName] =
      require(serviceFile.path.substr(0, serviceFile.path.lastIndexOf('.')))(services, models);
  });

  return services;
};
