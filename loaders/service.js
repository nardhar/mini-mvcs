const path = require('path');
const fileUtil = require('../util/file');

module.exports = (config, models) => {
  const services = {};

  // load the app services
  const configService = config.service || {};
  fileUtil.loaddirSync(
    path.resolve(config.appPath, configService.dir || './services'),
    `${configService.suffix || '.service'}.js`,
    configService.ignore || [],
    (err, file, filePath) => {
      const serviceName = fileUtil.normalizeName(file.substr(0, file.indexOf('.')));
      services[serviceName] =
        require(filePath.substr(0, filePath.lastIndexOf('.')))(services, models);
    },
  );

  return services;
};
