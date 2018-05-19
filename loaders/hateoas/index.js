const path = require('path');
const Resource = require('./resource');
const Collection = require('./collection');

const fileUtil = require('../../util/file');

const resources = [];

const register = (resource) => {
  resources.push(resource);
};

const searchResource = (url, callback) => {
  return callback(resources.find((res) => {
    return url === res.endpoint;
  }));
};

module.exports = (config) => {
  const transform = (object, url) => {
    return searchResource(url, (resource) => {
      // si no tiene un recurso mapeado
      if (!resource) return object;
      // si tiene un recurso mapeado
      return resource.transform(object);
    });
  };

  // lee las configuraciones de los recursos
  const configHateoas = config.hateoas || {};
  fileUtil.loaddirSync(
    path.resolve(config.appPath, configHateoas.dir || './hateoas'),
    `${configHateoas.suffix || '.resource'}.js`,
    configHateoas.ignore || [],
    (err, file, filePath) => {
      const resList = require(filePath.substr(0, filePath.lastIndexOf('.')));
      resList.forEach((res) => {
        if (res.entity) {
          const entity = resources.find((r) => {
            return res.entity === r.endpoint;
          });
          const collection = new Collection(res.endpoint, entity);
          res.links.forEach((link) => {
            collection.addLink(link.name, link.href);
          });
          register(collection);
        } else {
          const entity = new Resource(res.endpoint);
          res.links.forEach((link) => {
            entity.addLink(link.name, link.href);
          });
          register(entity);
        }
      });
    },
  );

  return { transform };
};
