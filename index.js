const path = require('path');

const appFolder = path.dirname(module.parent.filename);

const config = require('./src/loaders/config')(appFolder);
const models = require('./src/loaders/model')(config);
const withTransaction = require('./src/util/transactional')(models);
const errors = require('./src/errors');
const crudController = require('./src/crud/crud-controller')(withTransaction);
const crudService = require('./src/crud/crud-service');
const controllerLoader = require('./src/loaders/controller');

const start = () => {
  // the controllers are loaded later so that mini-mvcs package is available in the
  // controllers and services that inherit from crudController and crudService
  const expressApp = controllerLoader(config, models);

  // starts the app after syncing the database
  models.sequelize.sync().then(() => {
    if (process.env.FORCE || false) {
      process.exit(0);
    } else {
      const configServer = config.server || {};
      const port = configServer.port || 4000;
      expressApp.listen(port);
      // eslint-disable-next-line no-console
      console.log(`MiniMVCS app running on http://localhost:${port}
Here it is an ASCII Art Beaver
            ___
         .="   "=._.---.
       ."         c ' Y'\`p
      /   ,       \`.  w_/
  jgs |   '-.   /     /
_,..._|      )_-\\ \\_=.\\
\`-....-'\`------)))\`=-'"\`'"`);
    }
  });
};

module.exports = {
  start,
  config,
  models,
  errors,
  withTransaction,
  crudController,
  crudService,
};
