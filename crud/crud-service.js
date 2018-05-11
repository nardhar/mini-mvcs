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

  service.filter = (params) => {
    return params;
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
