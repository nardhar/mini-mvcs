const { expect } = require('chai');
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
    // holding the size of the callbacks to be executed for asking faster later
    const size = this.paths[req.originalUrl][req.method].length;
    // executing all the callbacks saved in this route
    return this.paths[req.originalUrl][req.method]
    .reduce((prevPromise, callback, idx) => {
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
        .then((body) => {
          // si es el ultimo callback, entonces llama al renderizador de respuesta
          if (idx === size - 1) {
            res.status(200).json(body);
          }
          return cont;
        });
      });
    }, Promise.resolve(true));
  }
}

const withTransactionMock = (callback, isTransactional) => {
  return callback()
  .then((result) => {
    return { ...result, wasTransactional: isTransactional };
  });
};

const crudController = require('../../../src/crud/crud-controller')(withTransactionMock);

const bookCrudService = {
  listAndCount(query) {
    return Promise.resolve({ rows: [{ title: 'sample', query }] });
  },
  read(id) {
    return Promise.resolve({ id, title: 'sample' });
  },
  save(params) {
    return Promise.resolve(params);
  },
  update(id, params) {
    return Promise.resolve({ id, ...params });
  },
  delete(id) {
    return Promise.resolve({ id });
  },
};

let routerMock;
let result;
let resMock;

describe('Unit Testing CRUD Controller', () => {
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

  describe('Creating a CRUD controller', () => {
    it('should respond a GET method', (done) => {
      crudController('book', routerMock, bookCrudService);

      routerMock.execute({ originalUrl: '/book', method: 'get', query: {} }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result).to.have.property('code');
        expect(result.data).to.have.property('rows');
        expect(result.data.rows).to.be.a('array');
        expect(result.data.rows).to.deep.include({ title: 'sample', query: {} });
        done();
      })
      .catch(done);
    });

    it('should respond a GET method with id', (done) => {
      crudController('book', routerMock, bookCrudService);

      routerMock.execute({ originalUrl: '/book/:id', method: 'get', params: { id: 2 } }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result).to.have.property('code');
        expect(result.data).to.have.property('id', 2);
        expect(result.data).to.have.property('title', 'sample');
        done();
      })
      .catch(done);
    });

    it('should respond a POST method', (done) => {
      crudController('book', routerMock, bookCrudService);

      routerMock.execute({ originalUrl: '/book', method: 'post', body: { title: 'ok' } }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result).to.have.property('code');
        expect(result.data).to.have.property('title', 'ok');
        done();
      })
      .catch(done);
    });

    it('should respond a PUT method', (done) => {
      crudController('book', routerMock, bookCrudService);

      routerMock.execute({
        originalUrl: '/book/:id',
        method: 'put',
        params: { id: 21 },
        body: { title: 'mytitle' },
      }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result).to.have.property('code');
        expect(result.data).to.have.property('id', 21);
        expect(result.data).to.have.property('title', 'mytitle');
        done();
      })
      .catch(done);
    });

    it('should respond a DELETE method', (done) => {
      crudController('book', routerMock, bookCrudService);

      routerMock.execute({
        originalUrl: '/book/:id',
        method: 'delete',
        params: { id: 11 },
      }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result).to.have.property('code');
        expect(result.data).to.have.property('id', 11);
        done();
      })
      .catch(done);
    });
  });
});
