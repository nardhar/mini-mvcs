const { ValidationError, NotFoundError } = require('../errors');

module.exports = (model) => {
  const service = {};

  service.validateWrapper = (instance) => {
    return instance.validate()
    .then((sequelizeValidationError) => {
      return new ValidationError(model.name, sequelizeValidationError);
    })
    .then((validationError) => {
      return service.validate(instance, validationError);
    })
    .then((validationError) => {
      if (validationError.hasErrors()) throw validationError;
      return instance;
    });
  };

  service.list = (params) => {
    return model.findAll(service.filter(params));
  };

  service.listAndCount = (params) => {
    return model.findAndCountAll(service.filter(params));
  };

  service.read = (id) => {
    return model.findOne({
      where: { id },
    })
    .then((instance) => {
      if (!instance) throw new NotFoundError(model.name, id);
      return instance;
    });
  };

  /**
   * Metodo para convertir los parametros enviados para sequelize.[list|find|etc.]
   * @param {Object} params parametros enviados
   * @param {Integer} params.limit cantidad de registros a encontrar
   * @param {Integer} params.offset cantidad de registros a saltarse
   * @param {Integer} params.page cantidad de paginas(params.limit*(params.page-1)) a saltarse
   * @param {Object[]} params.include modelos relacionados a ser incluidos
   * @return {Object} datos a ser enviados al filtro de sequelize
   */
  service.filter = (params) => {
    const where = Object.keys(params).reduce((whereResult, key) => {
      return ['limit', 'offset', 'page', 'include'].contains(key)
        ? whereResult
        : Object.assign({}, whereResult, { [key]: params[key] });
    }, {});
    return Object.assign({}, service.offsetLimit(params), service.include(params), { where });
  };

  service.offsetLimit = (params) => {
    if ('limit' in params && ('page' in params || 'offset' in params)) {
      return {
        offset: 'offset' in params
          ? params.offset
          : (params.page - 1) * params.limit,
        limit: params.limit,
      };
    }
    return {};
  };

  service.include = (params) => {
    return 'include' in params ? { include: params.include } : {};
  };

  service.find = (params) => {
    return model.findOne(service.filter(params));
  };

  service.create = (params) => {
    return model.build(params);
  };

  service.save = (params) => {
    return service.validateWrapper(service.create(params))
    .then((instance) => {
      return instance.save();
    });
  };

  service.edit = (id, params) => {
    return service.read(id)
    .then((instance) => {
      instance.set(params);
      return instance;
    });
  };

  service.update = (id, params) => {
    return service.edit(id, params)
    .then(service.validateWrapper)
    .then((instance) => {
      return instance.save();
    });
  };

  service.validate = (instance, validationError) => {
    // default validation
    return validationError;
  };

  service.delete = (id) => {
    return service.read(id)
    .then((instance) => {
      return instance.delete();
    });
  };

  return service;
};
