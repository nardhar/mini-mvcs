const { sep } = require('path');
const { expect } = require('chai');
const rewiremock = require('rewiremock').default;
const Router = require('../../mocks/router.mock');

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
  sep,
});

rewiremock('../util/file').with({
  loaddirSync(folder, suffix, ignore) {
    return [
      'book.controller.js',
      'author.controller.js',
      'ignore.controller.js',
      'notacontroller.js',
    ]
    .map((file) => {
      return { file, path: `${folder}${sep}${file}` };
    })
    .filter((file) => {
      return file.file.slice(-suffix.length) === suffix && ignore.indexOf(file.file) < 0;
    });
  },
  normalizeName(name) {
    return name.split(/-|_/).reduce((acc, val) => {
      return !acc ? val : `${acc}${val.charAt(0).toUpperCase()}${val.slice(1)}`;
    }, '');
  },
});

const serviceMock = {
  book: {
    save() {
      return Promise.resolve({ title: 'sample' });
    },
    list() {
      return Promise.resolve([{ title: 'sample' }]);
    },
  },
};

rewiremock('../../test/resource/srcSample/controllers/book.controller').with((router, services) => {
  router.get('/book', (req, res, next) => {
    return services.book.list()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });

  router.get('/book/:id', (req, res, next) => {
    return services.book.list()
    .then((bookList) => {
      return bookList[0];
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });

  router.post('/book', (req, res, next) => {
    return services.book.save()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });

  router.put('/book/:id', (req, res, next) => {
    return services.book.save()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });
});

rewiremock('../../test/resource/srcSample/controllers/author.controller').with((router) => {
  router.get('/author', (req, res, next) => {
    return Promise.resolve({ author: { name: 'john' } })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });
});

rewiremock('../../test/resource/srcSample/controllers/ignore.controller').with((router) => {
  router.get('/ignore', (req, res, next) => {
    return Promise.resolve({ sample: { no: 'john' } })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });
});

let routerMock;
let result;
let resMock;

let controllerLoader;

describe('Unit Testing Controller Loader', () => {
  before(() => {
    rewiremock.enable();
    controllerLoader = require('../../../src/loaders/controller');
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

  describe('Loading of default controllers folder', () => {
    it('should execute a simple get action from a loaded controller', (done) => {
      controllerLoader(
        {
          // since rewiremock only mocks existing modules we need to create the same file structure
          // for importing the dynamically called services with require, even though they will be
          // mocked here. Note: appPath must be relative to src/loaders/controller
          appPath: '../../test/resource/srcSample',
        },
        routerMock,
        serviceMock,
      );
      // the app should respond to the loaded controller paths
      routerMock.execute({ originalUrl: '/book', method: 'get' }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result.data).to.be.a('array');
        done();
      })
      .catch(done);
    });

    it('should execute a save action from a loaded controller', (done) => {
      controllerLoader(
        {
          // since rewiremock only mocks existing modules we need to create the same file structure
          // for importing the dynamically called services with require, even though they will be
          // mocked here. Note: appPath must be relative to src/loaders/controller
          appPath: '../../test/resource/srcSample',
        },
        routerMock,
        serviceMock,
      );
      // the app should respond to the loaded controller paths
      routerMock.execute({ originalUrl: '/book', method: 'post' }, resMock)
      .then(() => {
        expect(result).to.have.property('data');
        expect(result.data).to.have.property('title', 'sample');
        done();
      })
      .catch(done);
    });
  });
});
