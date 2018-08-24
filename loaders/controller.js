const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { loaddirSync } = require('../util/file');
const serviceLoader = require('./service');
const middlewareLoader = require('./middleware');

module.exports = (config, models) => {
  // creating the express app
  const app = express();

  // loading config.cors or the default cors configuration
  app.use(cors(config.cors || {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: true,
    headers: 'Cache-Control, Pragma, Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }));

  // loading config.globalMiddleware or the default global middlewares
  (config.globalMiddleware || [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: false }),
  ])
  .forEach(app.use);

  // loading the services since we well pass them to the middlewares and the controllers
  const services = serviceLoader(config, models);

  // creates the express router
  const router = express.Router();

  // it imports all the middlewares in the router within its path
  middlewareLoader(config, services).forEach((middlewareGroupList) => {
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
