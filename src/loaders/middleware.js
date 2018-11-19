const path = require('path');
const { loaddirSync } = require('../util/file');

module.exports = (config, services) => {
  // requires the app middlewares
  const configMiddleware = config.middleware || {};
  // loads the middlewares from the configured folder
  return loaddirSync(
    path.resolve(config.appPath, 'dir' in configMiddleware ? configMiddleware.dir : 'middlewares'),
    `${'suffix' in configMiddleware ? configMiddleware.suffix : '.middleware'}.js`,
    configMiddleware.ignore || [],
  )
  // requires each middleware
  .map((middlewareFile) => {
    return require(middlewareFile.path.substr(0, middlewareFile.path.lastIndexOf('.')))(services);
  })
  // adds the OPTIONS middleware
  .concat({
    // its path is = '*' so it will run in every route
    path: '*',
    // with order = 0 so it will run sooner
    // (no other middlewares should have order < 0, unless you know what you're doing)
    order: 0,
    // and its corresponding callback
    callback(req, res, next) {
      // it will jump all the middlewares in the same path if method === 'OPTIONS'
      if (req.method === 'OPTIONS') {
        next('route');
      } else {
        next();
      }
    },
  })
  // it sorts the middlewares and loads them in the router
  .sort((a, b) => {
    // if a middleware does not have an order then it is = 100
    return (a.order || 100) - (b.order || 100);
  })
  // groups the middlewares by path taking its order in account
  .reduce((middlewareGroupList, middleware) => {
    // if no path is defined then it uses the general path: '*'
    const middlewarePath = middleware.path || '*';
    // searchs its corresponding position in the resulting array
    const idx = middlewareGroupList.findIndex((group) => {
      // it searches by path
      return group.path === middlewarePath;
    });

    // if the group is not found then adds a new item
    if (idx < 0) {
      middlewareGroupList.push({ path: middlewarePath, middlewareList: [middleware.callback] });
    } else {
      // if it is found then adds it to the middleware list
      middlewareGroupList[idx].middlewareList.push(middleware.callback);
    }

    // and returns the result
    return middlewareGroupList;
  }, []);
};
