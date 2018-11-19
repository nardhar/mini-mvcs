const path = require('path');
const { loaddirSync } = require('../util/file');

module.exports = (config, router, services) => {
  const configController = config.controller || {};
  loaddirSync(
    path.resolve(config.appPath, 'dir' in configController ? configController.dir : 'controllers'),
    `${'suffix' in configController ? configController.suffix : '.controller'}.js`,
    configController.ignore || [],
  )
  .forEach((file) => {
    require(file.path.substr(0, file.path.lastIndexOf('.')))(router, services);
  });
};
