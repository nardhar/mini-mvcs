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
  return (endpoint, router, crudService, actionsParam = []) => {
    const actions = actionsParam.map(buildActions);

    findAction(actions, 'index', (isTransactional) => {
      router.get(`/${endpoint}`, (req) => {
        return withTransaction(() => {
          return crudService.listAndCount(req.query);
        }, isTransactional);
      });
    });

    findAction(actions, 'get', (isTransactional) => {
      router.get(`/${endpoint}/:id`, (req) => {
        return withTransaction(() => {
          return crudService.read(req.params.id);
        }, isTransactional);
      });
    });

    findAction(actions, 'post', (isTransactional) => {
      router.post(`/${endpoint}`, (req) => {
        return withTransaction(() => {
          return crudService.save(req.body);
        }, isTransactional);
      });
    });

    findAction(actions, 'put', (isTransactional) => {
      router.put(`/${endpoint}/:id`, (req) => {
        return withTransaction(() => {
          return crudService.update(req.params.id, req.body);
        }, isTransactional);
      });
    });

    findAction(actions, 'delete', (isTransactional) => {
      router.delete(`/${endpoint}/:id`, (req) => {
        return withTransaction(() => {
          return crudService.delete(req.params.id);
        }, isTransactional);
      });
    });
  };
};
