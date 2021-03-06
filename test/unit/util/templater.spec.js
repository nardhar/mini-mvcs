const { expect } = require('chai');
const rewiremock = require('rewiremock').default;
const Router = require('../../mocks/router.mock');

// I know I'm using a let in all the tests, but it's just for resetting a variable
let routerMock;
let result;
let resMock;

let templater;

describe('Unit Testing error handler', () => {
  before(() => {
    rewiremock.enable();
    templater = require('../../../src/util/templater');
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
    let templaterObject;

    beforeEach(() => {
      templaterObject = templater({}, routerMock);

      templaterObject.get(
        '/path',
        (req, res, next) => {
          res.passVariable = true;
          next();
        },
        (req, res, next) => {
          if (req.hasValue) {
            res.passVariable2 = true;
            next();
          } else {
            next('error');
          }
        },
        (req, res) => {
          return {
            one: res.passVariable,
            two: res.passVariable2,
            result: true,
          };
        },
      );
    });

    it('should keep passed variables through res and execute all callbacks if next()', (done) => {
      routerMock.execute({ hasValue: true, originalUrl: '/path', method: 'get' }, resMock)
      .then(() => {
        // the status code of the response does not change
        expect(result).to.have.property('code', 200);
        expect(result).to.have.property('data');
        expect(result.data).to.deep.equal({ one: true, two: true, result: true });
        done();
      })
      .catch(done);
    });

    it('should keep skip a callback', (done) => {
      routerMock.execute({ hasValue: false, originalUrl: '/path', method: 'get' }, resMock)
      .then(() => {
        // result should not be modififed, i.e.: be kept as an empty object
        expect(result).to.deep.equal({});
        done();
      })
      .catch(done);
    });
  });
});
