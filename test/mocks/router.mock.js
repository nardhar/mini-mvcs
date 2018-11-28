const http = require('http');

const httpMethods = http.METHODS ? http.METHODS.map((method) => {
  // converting to lowercase since router.METHOD expects lowercase methods
  return method.toLowerCase();
}) : [];

class Router {
  constructor() {
    this.paths = {};

    httpMethods.forEach((httpMethod) => {
      this[httpMethod] = (path, ...callbacks) => {
        this.paths[path] = {
          ...(this.paths[path] || {}),
          [httpMethod]: callbacks,
        };
      };
    });
  }

  // for mocking an http request made by express
  execute(req, res) {
    return this.paths[req.originalUrl][req.method]
    .reduce((prevPromise, callback) => {
      return prevPromise.then((prev) => {
        // we check if we should continue executing the callbacks
        if (!prev) return false;

        let cont = false; // ugh! is that an ugly let? like for real?, yeah, I Promise to change it
        // wrapping in Promise.resolve since there is no guarantee that all callbacks are Promises
        return Promise.resolve(callback(req, res, (...args) => {
          // if 'next()' is called with an argument (an error) then it doens't execute the rest of
          // the callbacks
          if (args.length === 0) cont = true;
        }))
        .then(() => {
          return cont;
        });
      });
    }, Promise.resolve(true));
  }
}

module.exports = Router;
