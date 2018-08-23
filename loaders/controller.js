const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const templater = require('../util/templater');
const { loaddirSync } = require('../util/file');
const serviceLoader = require('./service');

module.exports = (config, models) => {
  const services = serviceLoader(config, models);

  const app = express();

  app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: true,
    headers: 'Cache-Control, Pragma, Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    // 'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    // 'Expires': '-1',
    // 'Pragma': 'no-cache',
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // loads our templater
  templater.options({
    template: (object, defaultData, responseArgs, req) => { // eslint-disable-line no-unused-vars
      return object;
    },
  });
  app.use(templater);

  // creates the express router
  const router = express.Router();

  // requires the app middlewares
  const configMiddleware = config.middleware || {};
  loaddirSync(
    path.resolve(config.appPath, 'dir' in configMiddleware ? configMiddleware.dir : 'middlewares'),
    `${'suffix' in configMiddleware ? configMiddleware.suffix : '.middleware'}.js`,
    configMiddleware.ignore || [],
  )
  .map((middlewareFile) => {
    return require(middlewareFile.path.substr(0, middlewareFile.path.lastIndexOf('.')))(services);
  })
  // adds the OPTIONS middleware
  .concat({
    order: 0,
    callback: (req, res, next) => {
      // it will jump all the middlewares in the same path if method === 'OPTIONS'
      if (req.method === 'OPTIONS') {
        next('route');
      } else {
        next();
      }
    },
  })
  // it orders the middlewares and loads them in the router
  .sort((a, b) => {
    return (a.order || 100) - (b.order || 100);
  })
  .reduce((middlewareGroupList, middleware) => {
    // if no path is defined then it uses the general path: '*'
    const middlewarePath = middleware.path || '*';
    const idx = middlewareGroupList.findIndexOf((group) => {
      return group.path === middlewarePath;
    });

    if (idx < 0) {
      middlewareGroupList.push({
        path: middlewarePath,
        middlewareList: [middleware],
      });
      return middlewareGroupList;
    }

    middlewareGroupList[idx].middlewareList.push(middleware);

    return middlewareGroupList;
  }, [])
  .forEach((middlewareGroupList) => {
    router.use(middlewareGroupList.path, middlewareGroupList.middlewareList);
  });

  // it loads the controllers
  const configController = config.controller || {};
  loaddirSync(
    path.resolve(config.appPath, 'dir' in configController ? configController.dir : 'controllers'),
    `${'suffix' in configController ? configController.suffix : '.controller'}.js`,
    configController.ignore || [],
  )
  .forEach((controllerFile) => {
    require(controllerFile.path.substr(0, controllerFile.path.lastIndexOf('.')))(router, services);
  });

  // it loads the router into the app
  const configApi = config.api || {};
  app.use(configApi.main || '/api/v1', router);

  // it loads a really simple middleware error
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    // TODO: add an actual logger library
    console.error(err.stack); // eslint-disable-line no-console
    // TODO: upgrade to an actual error handler
    return res.status(req.method === 'get' ? 404 : 400).json({ error: err.message });
    // here i was trying to add an error handler
    // errors.handleError(err).then((httpError) => {
    //   return res.customRestFailure(httpError.data, {
    //     status: httpError.statusCode,
    //     mensaje: httpError.message,
    //   });
    // });
    // // it enables the error stacktrace only in dev
    // if (app.get('env') === 'development') {
    //   // eslint-disable-next-line no-console
    //   console.log(`Error en ${req.originalUrl}`);
    //   // eslint-disable-next-line no-console
    //   console.error(err.stack);
    // }
  });

  return app;
};
