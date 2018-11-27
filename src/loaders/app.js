const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const serviceLoader = require('./service');
const middlewareLoader = require('./middleware');
const templater = require('../util/templater');
const controllerLoader = require('./controller');
const errorHandleLoader = require('./error-handler');

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
  // .forEach(app.use) throws a TypeError: Cannot read property 'lazyrouter' of undefined
  .forEach((middleware) => {
    app.use(middleware);
  });

  // loading the services since we will pass them to the middlewares and the controllers
  const services = serviceLoader(config, models);

  // creates the express router
  const router = express.Router();

  // it imports all the middlewares in the router within its path
  middlewareLoader(config, services).forEach((middlewareGroupList) => {
    router.use(middlewareGroupList.path, middlewareGroupList.middlewareList);
  });

  // imports the templater
  const templateRouter = 'routerTemplate' in config && config.routerTemplate === false
    ? router
    : templater(config, router);

  // it loads the controllers
  controllerLoader(config, templateRouter, services);

  // it loads the router into the app
  const configApi = config.api || {};
  app.use(configApi.main || '/api/v1', router);

  // it loads the generated error handler
  app.use(errorHandleLoader(config));

  return app;
};
