const path = require('path');
const { expect } = require('chai');

const controllerLoader = require('../../../src/loaders/controller');

const extractRoutes = (app) => {
  // eslint-disable-next-line no-underscore-dangle
  const routesMap = app._router.stack.reduce((acc, middleware) => {
    if (middleware.name === 'router') {
      return middleware.handle.stack.reduce((acc2, middleware2) => {
        const route = middleware2.route.path;
        const methods = Object.keys(middleware2.route.methods);

        return {
          ...acc2,
          [route]: (acc2[route] || []).concat(methods),
        };
      }, acc);
    }
    return acc;
  }, {});
  return Object.keys(routesMap).map((route) => {
    return { route, methods: routesMap[route] };
  });
};

describe('Integration Testing Controller Loader', () => {
  describe('load a controllers folder', () => {
    const controllerPath = path.resolve(__dirname, '../../resource/srcSample');

    it('should load a controllers folder with default options', (done) => {
      const controllers = controllerLoader({
        appPath: controllerPath,
      }, {});
      const routes = extractRoutes(controllers);

      // double _all for the OPTIONS middleware and the added in the current app
      expect(routes).to.deep.include({ route: '*', methods: ['_all'] });
      expect(routes).to.deep.include({ route: '/book', methods: ['get', 'post'] });
      expect(routes).to.deep.include({ route: '/book/:id', methods: ['get', 'put'] });
      done();
    });
  });
});
