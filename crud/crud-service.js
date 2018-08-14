const { ValidationError, NotFoundError } = require('../errors');

const objectMinusProperty = (object, property) => {
  return Object.keys(object).reduce((acc, val) => {
    return val === property ? acc : Object.assign({}, acc, { [val]: object[val] });
  }, {});
};

const defaultFilter = (params, model) => {
  // if there are associations on the query
  if (!params) return {};

  const include = [];
  const where = Object.keys(params).reduce((whereResult, key) => {
    // it doesn't add pagination properties
    if (['limit', 'offset', 'page'].indexOf(key) >= 0) return whereResult;
    // if it is an association
    if (key in model.associations) {
      include.push(Object.assign(
        {
          model: model.associations[key].target,
          as: model.associations[key].as,
        },
        // associations are "required" on demand
        'required' in params[key] ? { required: params[key].required } : {},
        // using the default filter again over the associated model
        defaultFilter(
          // whether it is required or not then it should remove the "required" property
          objectMinusProperty(params[key], 'required'),
          // sends the associated model for base of the new filter
          model.associations[key].target,
        ),
      ));
      return whereResult;
    }
    // TODO: maybe it should add only if it is either a Sequelize.Op or a model property
    return Object.assign({}, whereResult, { [key]: params[key] });
  }, {});

  // builds the final object
  return Object.assign(
    {},
    Object.keys(where).length > 0 ? { where } : {},
    include.length > 0 ? { include } : {},
  );
};

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
   * Method for making simple and easy sequelize queries
   * @param {Object} params Object parameters
   * @param {Integer} params.limit Amount of records to be returned
   * @param {Integer} params.offset Amount of offset records
   * @param {Integer} params.page Amount of offset pages(offset = limit * (page - 1))
   * @return {Object} Sequelize query param formatted
   */
  service.filter = (params) => {
    // builds the final object (it adds pagination here)
    return Object.assign(
      {},
      service.offsetLimit(params),
      defaultFilter(params, model),
    );
  };

  service.offsetLimit = (params) => {
    if (params && 'limit' in params && ('page' in params || 'offset' in params)) {
      return {
        offset: 'offset' in params
          ? params.offset
          : (params.page - 1) * params.limit,
        limit: params.limit,
      };
    }
    return {};
  };

  service.find = (params) => {
    return model.findOne(service.filter(params))
    .then((instance) => {
      if (!instance) throw new NotFoundError(model.name, params);
      return instance;
    });
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
      return instance.destroy();
    });
  };

  return service;
};
