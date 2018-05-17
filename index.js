const path = require('path');

const appFolder = path.dirname(module.parent.filename);

// carga los archivos de configuracion
const config = require('./loaders/config')(appFolder);
const models = require('./loaders/model')(config);
// carga los parametros a publicar
const transactional = require('./util/transactional')(models);
const errors = require('./errors');
const crudController = require('./crud/crud-controller')(transactional);
const crudService = require('./crud/crud-service');
const controllerLoader = require('./loaders/controller');

const start = () => {
  // carga despues los controladores para que el paquete mini-mvcs esté disponible en
  // los controladores/servicios que heredan de crudController y crudService respectivamente
  const expressApp = controllerLoader(config, models);

  models.sequelize.sync().then(() => {
    if (process.env.FORCE || false) {
      process.exit(0);
    } else {
      expressApp.listen(config.server.port);
      console.log(`
                            ___
                         .="   "=._.---.
                       ."         c ' Y'\`p
                      /   ,       \`.  w_/
                  jgs |   '-.   /     /
                _,..._|      )_-\\ \\_=.\\
                \`-....-'\`------)))\`=-'"\`'"

          Sistema ejecutandose en el puerto ${config.server.port}
      ______________________________________________
              // NOTE: La imagen es un castor
      `);
    }
  });
};

// inicia la app despues de sincronizar la base
module.exports = {
  start,
  config,
  models,
  errors,
  withTransaction: transactional,
  crudController,
  crudService,
};
