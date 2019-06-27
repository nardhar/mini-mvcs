const http = require('http');

// getting all methods for a express.Router
const httpMethods = http.METHODS ? http.METHODS.map((method) => {
  // converting to lowercase since router.METHOD expects lowercase methods
  return method.toLowerCase();
}) : [];

// default status codes
const defaultStatusCodes = {
  get: 200,
  post: 201,
  put: 200,
  patch: 200,
  delete: 204,
  default: 200,
};

// default templater function that does nothing
const defaultTemplater = (req, res, body) => {
  return body;
};

module.exports = (config, router) => {
  const configTemplater = config.routerTemplate || {};
  const statusCode = {
    ...defaultStatusCodes,
    ...(configTemplater.statusCodes || {}),
  };
  const templater = configTemplater.template || defaultTemplater;

  // returning an object that has the same methods as a express.Router
  return {
    // returning the express router in case we would want to avoid all the templater stack
    expressRouter: router,
    // simple wrappers that just run the router
    ...['all', 'param', 'route', 'use'].reduce((otherMethods, method) => {
      return { ...otherMethods, [method]: (...args) => { return router[method](...args); } };
    }, {}),
    // actual METHOD wrappers that are expected to be formatted with the templater
    ...httpMethods.reduce((httpMethodsObject, httpMethod) => {
      return {
        ...httpMethodsObject,
        [httpMethod]: (path, ...args) => {
          router[httpMethod](path, ...args.slice(0, args.length - 1).concat((req, res, next) => {
            // wrapping last callback with a Promise in case its result is not a Promise
            return Promise.resolve(args[args.length - 1](req, res, next))
            .then((body) => {
              // will send data if no response was already sent
              if (!res.headersSent) {
                // we use the configured status code by the request method
                res.status(statusCode[req.method.toLowerCase()] || statusCode.default)
                .json(templater(req, res, body));
              }
            })
            .catch(next);
          }));
        },
      };
    }, {}),
  };
};
