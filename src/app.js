class App {
  constructor(config = {}) {
    this.config = config;

    // starting properties
    this.models = null;
    this.services = null;
    this.logger = null;
  }

  withTransaction(fun, isTransactional = true) {
    return isTransactional ? this.models.transaction(fun) : Promise.resolve(fun());
  }

  start() {
    // loads the resources (models, controllers, services, logger)
    return this.config.loaders.models(this.config.models)
    .then((models) => {
      this.models = models;
    })
    .then(() => {
      return this.config.loaders.services(this.config.services)
      .then((services) => {
        this.services = services;
      });
    })
    .then(() => {
      return this.config.loaders.controllers(this.config.controllers)
      .then((webApp) => {
        this.webApp = webApp;
      });
    })
    .then(() => {
      // runs the app
      if (process.env.NODE_ENV === 'test') {
        return this.webApp;
      }
      const configServer = this.config.server || {};
      const port = configServer.port || 4000;
      // it could send some other options according to implementation
      this.webApp.listen(port, configServer.options);

      return this.webApp;
    });
  }
}

module.exports = App;
