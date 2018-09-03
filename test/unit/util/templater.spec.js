const { expect } = require('chai');
const rewiremock = require('rewiremock').default;
const http = require('http');

const httpMethods = http.METHODS ? http.METHODS.map((method) => {
  // converting to lowercase since router.METHOD expects lowercase methods
  return method.toLowerCase();
}) : [];

let templater;

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

// I know I'm using a let in all the tests, but it's just for resetting a variable
let routerMock;
let result;
let resMock;

describe('Unit Testing error handler', () => {
  before(() => {
    rewiremock.enable();
    templater = require('../../../util/templater');
  });

  after(() => { rewiremock.disable(); });

  beforeEach(() => {
    routerMock = new Router();
    result = {};
    resMock = {
      headersSent: false,
      status(code) {
        result.code = code;
        return {
          json(data) {
            result.data = data;
          },
        };
      },
    };
  });

  describe('Loading of default templater', () => {
    it('should load a default object', (done) => {
      const templaterObject = templater({}, routerMock);
      expect(templaterObject).to.have.property('all');
      expect(templaterObject).to.have.property('param');
      expect(templaterObject).to.have.property('route');
      expect(templaterObject).to.have.property('use');
      expect(templaterObject).to.have.property('get');
      expect(templaterObject).to.have.property('post');
      expect(templaterObject).to.have.property('put');
      expect(templaterObject).to.have.property('patch');
      expect(templaterObject).to.have.property('delete');
      expect(templaterObject).to.have.property('head');
      done();
    });
  });

  describe('Execution of a templater', () => {
    let templaterObject;

    beforeEach(() => {
      templaterObject = templater({}, routerMock);
    });

    it('should execute a get http method', (done) => {
      templaterObject.get('/path', () => {
        return { name: 'Planes' };
      });

      routerMock.execute({ originalUrl: '/path', method: 'get' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 200);
        expect(result).to.have.property('data');
        expect(result.data).to.have.property('name', 'Planes');
        done();
      })
      .catch(done);
    });

    it('should execute a post http method', (done) => {
      templaterObject.post('/path', () => {
        return { name: 'Path name' };
      });

      routerMock.execute({ originalUrl: '/path', method: 'post' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 201);
        expect(result).to.have.property('data');
        expect(result.data).to.have.property('name', 'Path name');
        done();
      })
      .catch(done);
    });
  });

  describe('Execution of a templater with configured status codes', () => {
    let templaterObject;

    beforeEach(() => {
      templaterObject = templater({
        routerTemplate: {
          statusCodes: {
            get: 204,
            post: 200,
            put: 201,
            patch: 202,
            delete: 202,
            default: 201,
          },
        },
      }, routerMock);

      templaterObject.get('/path', () => { return { name: 'Planes' }; });
      templaterObject.post('/path', () => { return { name: 'Planes' }; });
      templaterObject.put('/path', () => { return { name: 'Planes' }; });
      templaterObject.patch('/path', () => { return { name: 'Planes' }; });
      templaterObject.delete('/path', () => { return { name: 'Planes' }; });
      templaterObject.head('/path', () => { return { name: 'Planes' }; });
    });

    it('should change the status code from a get', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'get' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 204);
        done();
      })
      .catch(done);
    });

    it('should change the status code from a post', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'post' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 200);
        done();
      })
      .catch(done);
    });

    it('should change the status code from a put', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'put' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 201);
        done();
      })
      .catch(done);
    });

    it('should change the status code from a patch', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'patch' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 202);
        done();
      })
      .catch(done);
    });

    it('should change the status code from a delete', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'delete' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 202);
        done();
      })
      .catch(done);
    });

    it('should change the status code from other method (default)', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'head' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 201);
        done();
      })
      .catch(done);
    });
  });

  describe('Execution of a templater with a configured template', () => {
    let templaterObject;

    beforeEach(() => {
      templaterObject = templater({
        routerTemplate: {
          template(req, res, body) {
            return {
              bodyCode: req.method === 'post' ? 202 : 200,
              bodyData: body,
            };
          },
        },
      }, routerMock);

      templaterObject.get('/path', () => { return { name: 'Planes' }; });
      templaterObject.post('/path', () => { return { name: 'Planes' }; });
    });

    it('should change the result of the body', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'get' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 200);
        expect(result).to.have.property('data');
        expect(result.data).to.have.property('bodyCode', 200);
        expect(result.data).to.have.property('bodyData');
        expect(result.data.bodyData).to.deep.equal({ name: 'Planes' });
        done();
      })
      .catch(done);
    });

    it('should change the result of the body and use a the request variable', (done) => {
      routerMock.execute({ originalUrl: '/path', method: 'post' }, resMock)
      .then(() => {
        // the status code of the response does not change
        expect(result).to.have.property('code', 201);
        expect(result).to.have.property('data');
        expect(result.data).to.have.property('bodyCode', 202);
        expect(result.data).to.have.property('bodyData');
        expect(result.data.bodyData).to.deep.equal({ name: 'Planes' });
        done();
      })
      .catch(done);
    });
  });

  describe('Wrapping of multiple callbacks', () => {
    // TODO
  });
});
