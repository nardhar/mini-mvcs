const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const templater = require('../util/templater');
const fileUtil = require('../util/file');
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

  // loads the middleware
  router.all(
    '*',
    (req, res, next) => {
      if (req.method === 'OPTIONS') {
        // here it exits the other middlewares
        next('route');
      } else {
        next();
      }
    },
  );

  // requires the app middlewares
  const configMiddleware = config.middleware || {};
  const middlewareList = [];
  fileUtil.loaddirSync(
    path.resolve(config.appPath, configMiddleware.dir || './middlewares'),
    `${configMiddleware.suffix || '.middleware'}.js`,
    configMiddleware.ignore || [],
    (err, file, filePath) => {
      const middleware = require(filePath.substr(0, filePath.lastIndexOf('.')))(services);
      middlewareList.push(middleware);
    },
  );

  // it orders the middlewares and loads them in the router
  middlewareList.sort((a, b) => {
    return (a.order || 100) - (b.order || 100);
  })
  .forEach((middleware) => {
    router.all('*', middleware.callback);
  });

  // it loads the controllers
  const configController = config.controller || {};
  fileUtil.loaddirSync(
    path.resolve(config.appPath, configController.dir || './controllers'),
    `${configController.suffix || '.controller'}.js`,
    configController.ignore || [],
    (err, file, filePath) => {
      require(filePath.substr(0, filePath.lastIndexOf('.')))(router, services);
    },
  );

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
