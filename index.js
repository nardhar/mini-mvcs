// carga los archivos de configuracion
const config = require('./loaders/config');

// carga los parametros a publicar
const db = require('./loaders/model');
const services = require('./loaders/service');
const expressApp = require('./loaders/controller');
const transactional = require('./util/transactional');
const errors = require('./errors');
const crudController = require('./crud/crud-controller');
const crudService = require('./crud/crud-service');

const start = () => {
  db.sequelize.sync().then(() => {
    if (process.env.FORCE || false) {
      process.exit(0);
    } else {
      https.createServer(expressApp).listen(config.server.port);
      console.log(`
                            ___
                         .="   "=._.---.
                       ."         c ' Y'\`p
                      /   ,       \`.  w_/
                  jgs |   '-.   /     /
                _,..._|      )_-\\ \\_=.\\
                \`-....-'\`------)))\`=-'"\`'"

        Sistema ejecutandose en el puerto ${config.server.port}
        ________________________________________________
                // NOTE: La imagen es un castor
      `);
    }
  });
};

// inicia la app despues de sincronizar la base
module.exports = {
  start,
  models: db,
  services,
  controllers: expressApp,
  errors,
  transactional,
  crudController,
  crudService,
};
