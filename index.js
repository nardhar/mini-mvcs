const path = require('path');

const appFolder = path.dirname(module.parent.filename);

const config = require('./src/loaders/config')(appFolder);
const models = require('./src/loaders/model')(config);
const withTransaction = require('./src/util/transactional')(models);
const errors = require('./src/errors');
const crudController = require('./src/crud/crud-controller')(withTransaction);
const crudService = require('./src/crud/crud-service');
const appLoader = require('./src/loaders/app');

const start = () => {
  // the app is loaded later so that mini-mvcs package is available in the
  // controllers and services that inherit from crudController and crudService
  // but making the services impossible to be imported in an additional custom
  // layer of the app (this should be prompted later)
  const app = appLoader(config, models);

  // starts the app after syncing the database
  return models.sequelize.sync().then(() => {
    if (process.env.FORCE || false) {
      process.exit(0);
      return app;
    }
    if (process.env.NODE_ENV === 'test') {
      return app;
    }
    const configServer = config.server || {};
    const port = configServer.port || 4000;
    app.listen(port);
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
    return app;
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
