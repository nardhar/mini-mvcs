const defaultTransactional = (method) => {
  return ['post', 'put', 'delete'].indexOf(method.toLowerCase()) > -1;
};

const buildActions = (action) => {
  const actionObject = typeof action === 'string' ? { method: action } : action;
  return {
    method: actionObject.method.toLowerCase(),
    transactional: 'transactional' in actionObject
      ? actionObject.transactional
      : defaultTransactional(actionObject.method),
  };
};

const findAction = (actions, method, callback) => {
  if (actions.length === 0) {
    callback(defaultTransactional(method));
  } else {
    const action = actions.find((a) => {
      return a.method === method;
    });
    if (action) {
      callback(action.transactional);
    }
  }
};

module.exports = (withTransaction) => {
  return (endpoint, router, service, actionsParam = []) => {
    const actions = actionsParam.map(buildActions);

    findAction(actions, 'index', (isTransactional) => {
      router.get(`/${endpoint}`, (req, res, next) => {
        return withTransaction(() => {
          return service.listAndCount(req.query);
        }, isTransactional)
        .then(res.customRest)
        .catch(next);
      });
    });

    findAction(actions, 'get', (isTransactional) => {
      router.get(`/${endpoint}/:id`, (req, res, next) => {
        return withTransaction(() => {
          return service.read(req.params.id);
        }, isTransactional)
        .then(res.customRest)
        .catch(next);
      });
    });

    findAction(actions, 'post', (isTransactional) => {
      router.post(`/${endpoint}`, (req, res, next) => {
        return withTransaction(() => {
          return service.save(req.body);
        }, isTransactional)
        .then(res.customRest)
        .catch(next);
      });
    });

    findAction(actions, 'put', (isTransactional) => {
      router.put(`/${endpoint}/:id`, (req, res, next) => {
        return withTransaction(() => {
          return service.update(req.params.id, req.body);
        }, isTransactional)
        .then(res.customRest)
        .catch(next);
      });
    });

    findAction(actions, 'delete', (isTransactional) => {
      router.delete(`/${endpoint}/:id`, (req, res, next) => {
        return withTransaction(() => {
          return service.delete(req.params.id);
        }, isTransactional)
        .then(res.customRest)
        .catch(next);
      });
    });
  };
};
