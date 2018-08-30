const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

let templater;

class Router {
  constructor() {
    this.paths = {};
  }

  get(path, ...callbacks) {
    this.paths[`${path}_get`] = callbacks;
  }

  execute(req, res) {
    const callbacks = this.paths[`${req.originalUrl}_${req.method}`];
    // TODO: fix for correct use of 'next' callback
    // maybe use an async iterator? or an async reduce()
    return Promise.all(callbacks.map((callback) => {
      return callback(req, res, () => {});
    }));
  }
}

const routerMock = new Router();

let result;
let resMock;

describe('Unit Testing error handler', () => {
  before(() => {
    rewiremock.enable();
    templater = require('../../../util/templater');
  });

  after(() => { rewiremock.disable(); });

  beforeEach(() => {
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

    it('should execute http methods', (done) => {
      const templaterObject = templater({}, routerMock);

      templaterObject.get('/path', () => {
        return { name: 'Planes' };
      });

      routerMock.execute({ originalUrl: '/path', method: 'get' }, resMock)
      .then(() => {
        expect(result).to.have.property('code', 200);
        expect(result).to.have.property('data');
        expect(result.data).to.have.property('name', 'Planes');
        done();
      });
    });
  });
});
