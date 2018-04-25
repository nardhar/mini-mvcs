const express = require('express');
const bodyParser = require('body-parser');
// const jwt = require('jwt-simple');
// const request = require('request');
const cors = require('cors');
const templater = require('../util/templater');
const fileUtil = require('../util/file');
// const hateoas = require('../hateoas');
const services = require('./service');

// carga la configuracion
const config = require('./config');

const app = express();

// app.use(logger('dev'));
// Realiza el uso y configuracion de cors.
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

// carga el templater
templater.options({
  template: (object, defaultData, responseArgs, req) => {
    // return hateoas.transform(object, req.route.path);
    return object;
  },
});
app.use(templater);

// crea el router rest
const router = express.Router()

// carga el pre-middlewares
// TODO: leer de un array
router.all(
  '*',
  // 1. prueba si el metodo es OPTIONS para saltarse todo la pila middleware actual
  (req, res, next) => {
    if (req.method === 'OPTIONS') {
      // aqui se salta la pila de middleware
      next('route');
    } else {
      next();
    }
  },
);

// carga las rutas de /controllers
fileUtil.loaddirSync(
  config.controller.dir || '../../../controllers',
  config.controller.suffix || '.controller.js',
  config.controller.ignore || [],
  (err, file, filePath) => {
    require(filePath.substr(0, filePath.lastIndexOf('.')))(router, services);
  },
);

// carga el router a la aplicacion
app.use(config.api.main || '/api/v1', router);

// carga el middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(400).json({});
  // errors.handleError(err).then((httpError) => {
  //   return res.customRestFailure(httpError.data, {
  //     status: httpError.statusCode,
  //     mensaje: httpError.message,
  //   });
  // });
  // // habilita el stacktrace de errores en desarrollo
  // if (app.get('env') === 'development') {
  //   // eslint-disable-next-line no-console
  //   console.log(`Error en ${req.originalUrl}`);
  //   // eslint-disable-next-line no-console
  //   console.error(err.stack);
  // }
});

module.exports = app;
