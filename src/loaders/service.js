const path = require('path');
const { loaddirSync, normalizeName } = require('../util/file');

const objectMerge = (dest, source) => {
  const result = { ...dest };
  Object.keys(source).forEach((property) => {
    if (typeof source[property] === 'object' && source[property] !== null) {
      result[property] = objectMerge(dest[property] || {}, source[property]);
    } else {
      result[property] = source[property];
    }
  });
  return result;
};

const getServiceNamespace = (dir, serviceFile, service) => {
  // first it checks if the namespace is a property from the service
  if ('namespace' in service && service.namespace && typeof service.namespace === 'string') {
    return service.namespace.split('.');
  }
  // then it gets the namespace from the file's path
  const start = dir.length + 1;
  const end = serviceFile.path.length - serviceFile.file.length - 1;
  // it only extracts the namespace if the service is in a folder
  return end > start
    ? serviceFile.path.substring(start, end).split(path.sep)
    : [];
};

module.exports = (config, models) => {
  const services = {};

  // load the app services
  const configService = config.service || {};
  const serviceDir = path.resolve(
    config.appPath,
    'dir' in configService ? configService.dir : 'services',
  );
  loaddirSync(
    serviceDir,
    `${'suffix' in configService ? configService.suffix : '.service'}.js`,
    configService.ignore || [],
  )
  // using a forEach because we need the same services object as a parameter for each object member
  .forEach((serviceFile) => {
    const serviceName = normalizeName(serviceFile.file.substr(0, serviceFile.file.indexOf('.')));
    const servicePath = serviceFile.path.substr(0, serviceFile.path.lastIndexOf('.'));
    const service = require(servicePath)(services, models);

    const namespace = configService.useNamespaces
      ? getServiceNamespace(serviceDir, serviceFile, service)
      : [];

    if (namespace.length > 0) {
      const [first, ...splitted] = namespace;
      services[first] = objectMerge(services[first] || {}, splitted.reduceRight((value, part) => {
        return { [part]: value };
      }, { [serviceName]: service }));
    } else {
      services[serviceName] = service;
    }
  });

  return services;
};
