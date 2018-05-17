const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const templater = require('../util/templater');
const fileUtil = require('../util/file');
const serviceLoader = require('./service');
// const hateoas = require('../hateoas');

module.exports = (config, models) => {
  const services = serviceLoader(config, models);

  const app = express();

  // app.use(logger('dev'));
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
      // return hateoas.transform(object, req.route.path);
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
  const middlewareList = [];
  fileUtil.loaddirSync(
    path.resolve(config.appPath, config.middleware.dir || './middlewares'),
    config.middleware.suffix || '.middleware.js',
    config.middleware.ignore || [],
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
  fileUtil.loaddirSync(
    path.resolve(config.appPath, config.controller.dir || './controllers'),
    config.controller.suffix || '.controller.js',
    config.controller.ignore || [],
    (err, file, filePath) => {
      require(filePath.substr(0, filePath.lastIndexOf('.')))(router, services);
    },
  );

  // it loads the router into the app
  app.use(config.api.main || '/api/v1', router);

  // it loads a really simple middleware error
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error(err.stack); // eslint-disable-line no-console
    return res.status(400).json({});
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
