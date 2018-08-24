const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { loaddirSync } = require('../util/file');
const serviceLoader = require('./service');
const middlewareLoader = require('./middleware');
const { ApiError } = require('../errors');

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

  // loading a not so simple error handler
  const configError = config.error || {};
  // loads the configured logger or a simple default one (console.error)
  const configErrorLogger = configError.logger || console.error; // eslint-disable-line no-console
  // loads the configured error status codes
  // (if a custom error is created then it should be added in the error.codes section, document it!)
  const configErrorCodes = configError.codes || {};
  // ...for merging with the default ones
  const errorCodes = {
    ...{
      ValidationError: 412,
      NotFoundError: 404,
      default: 400,
      internal: 500,
    },
    configErrorCodes,
  };
  // loads the configured error renderer or uses a simple default one
  const errorRenderer = configError.renderer || ((err) => {
    return { message: err.message, errors: err.getBody() };
  });

  // it loads a really simple middleware error
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    // it always logs the errors
    configErrorLogger(err);

    // if no response has already been sent
    if (!res.headersSent) {
      // checks if it is a controlled error
      if (err instanceof ApiError) {
        // and finds the corresponding status code for the response
        res.status(errorCodes[err.type] || errorCodes.default).json(errorRenderer(err));
      } else {
        // if it is not a controlled error, then send a Server error
        // (some code has thrown an exception)
        res.status(errorCodes.internal).json(errorRenderer({
          message: 'Internal Server Error',
          getBody() { return []; },
        }));
      }
    }
  });

  return app;
};
