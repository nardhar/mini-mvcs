const path = require('path');
const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const rewiremock = require('rewiremock').default;

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
});
rewiremock('../util/file').with({
  loaddirSync(folder, suffix, ignore) {
    return [
      'auth.middleware.js',
      'sample.middleware.js',
      'with-path-1.middleware.js',
      'same-path-1.middleware.js',
      'other-path-1.middleware.js',
      'with-path-2.middleware.js',
      'same-path-2.middleware.js',
      'ignore.middleware.js',
      'notamiddleware.js',
    ]
    .map((file) => {
      return { file, path: `${folder}${path.sep}${file}` };
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
// mocking require of each service itself
rewiremock('../test/resource/srcSample/middlewares/auth.middleware').with((services) => {
  return {
    order: 10,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-auth')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'auth' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/sample.middleware').with((services) => {
  return {
    order: 20,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-sample')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'sample' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/ignore.middleware').with((services) => {
  return {
    order: 25,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-ignore')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'ignore' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/with-path-1.middleware').with((services) => {
  return {
    path: '/path1',
    order: 30,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-1-1')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'path1-1' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/same-path-1.middleware').with((services) => {
  return {
    path: '/path1',
    order: 35,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-1-2')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'path1-2' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/other-path-1.middleware').with((services) => {
  return {
    path: '/path1',
    order: 40,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-1-3')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'path1-3' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/with-path-2.middleware').with((services) => {
  return {
    path: '/path2',
    order: 45,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-2-1')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'path2-1' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/same-path-2.middleware').with((services) => {
  return {
    path: '/path2',
    order: 50,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('text-2-2')
      .then((text) => {
        res.locals.callbacks = (res.locals.callbacks || []).concat({ text, middleware: 'path2-2' });
        next();
      });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewares/notamiddleware').with((services) => {
  return {
    path: '/path3',
    order: 55,
    callback: (req, res, next) => {
      return services.sample.toUpperCase('two')
      .then(() => { next(); });
    },
  };
});
rewiremock('../test/resource/srcSample/middlewaresIgnore/auth.middleware').with(() => {
  return {
    order: 10,
    callback: (req, res, next) => {
      next();
    },
  };
});
rewiremock('../test/resource/srcSample/middlewaresIgnore/sample.middleware').with(() => {
  return {
    order: 20,
    callback: (req, res, next) => {
      next();
    },
  };
});

const servicesMock = {
  sample: {
    toUpperCase(text) {
      return Promise.resolve(text.toUpperCase());
    },
  },
};

let middlewareLoader;

describe('Unit Testing middleware Loader', () => {
  before(() => {
    rewiremock.enable();
    middlewareLoader = require('../../../loaders/middleware');
  });

  after(() => { rewiremock.disable(); });

  describe('Loading of middleware', () => {
    it('should load a default middleware folder', (done) => {
      const middlewares = middlewareLoader(
        {
          // since rewiremock only mocks existing modules we need to create the same file structure
          // for importing the dynamically called services with require, even though they will be
          // mocked here. Note: appPath must be relative to loaders/service
          appPath: '../test/resource/srcSample',
        },
        servicesMock,
      );
      expect(middlewares).to.be.an('array');
      expect(middlewares).to.have.lengthOf(3); // *, path1 and path2
      expect(middlewares[0].path).to.equal('*');
      expect(middlewares[0].middlewareList).to.be.an('array');
      expect(middlewares[0].middlewareList).to.have.lengthOf(4); // counting the OPTIONS middleware
      expect(middlewares[0].middlewareList[0]).to.be.a('function');
      expect(middlewares[0].middlewareList[1]).to.be.a('function');
      expect(middlewares[0].middlewareList[2]).to.be.a('function');
      expect(middlewares[0].middlewareList[3]).to.be.a('function');
      expect(middlewares[1].path).to.equal('/path1');
      expect(middlewares[1].middlewareList).to.be.an('array');
      expect(middlewares[1].middlewareList).to.have.lengthOf(3);
      expect(middlewares[1].middlewareList[0]).to.be.a('function');
      expect(middlewares[1].middlewareList[1]).to.be.a('function');
      expect(middlewares[1].middlewareList[2]).to.be.a('function');
      expect(middlewares[2].path).to.equal('/path2');
      expect(middlewares[2].middlewareList).to.be.an('array');
      expect(middlewares[2].middlewareList).to.have.lengthOf(2);
      expect(middlewares[2].middlewareList[0]).to.be.a('function');
      expect(middlewares[2].middlewareList[1]).to.be.a('function');
      done();
    });

    it('should load a middleware folder with a custom suffix', (done) => {
      const middlewares = middlewareLoader(
        {
          appPath: '../test/resource/srcSample',
          middleware: {
            suffix: 'middleware', // without a .
          },
        },
        servicesMock,
      );
      expect(middlewares).to.be.an('array');
      expect(middlewares).to.have.lengthOf(4); // *, path1 and path2
      expect(middlewares[0].path).to.equal('*');
      expect(middlewares[0].middlewareList).to.be.an('array');
      expect(middlewares[0].middlewareList).to.have.lengthOf(4);
      expect(middlewares[0].middlewareList[0]).to.be.a('function');
      expect(middlewares[0].middlewareList[1]).to.be.a('function');
      expect(middlewares[0].middlewareList[2]).to.be.a('function');
      expect(middlewares[0].middlewareList[3]).to.be.a('function');
      expect(middlewares[1].path).to.equal('/path1');
      expect(middlewares[1].middlewareList).to.be.an('array');
      expect(middlewares[1].middlewareList).to.have.lengthOf(3);
      expect(middlewares[1].middlewareList[0]).to.be.a('function');
      expect(middlewares[1].middlewareList[1]).to.be.a('function');
      expect(middlewares[1].middlewareList[2]).to.be.a('function');
      expect(middlewares[2].path).to.equal('/path2');
      expect(middlewares[2].middlewareList).to.be.an('array');
      expect(middlewares[2].middlewareList).to.have.lengthOf(2);
      expect(middlewares[2].middlewareList[0]).to.be.a('function');
      expect(middlewares[2].middlewareList[1]).to.be.a('function');
      expect(middlewares[3].path).to.equal('/path3');
      expect(middlewares[3].middlewareList).to.be.an('array');
      expect(middlewares[3].middlewareList).to.have.lengthOf(1);
      expect(middlewares[3].middlewareList[0]).to.be.a('function');
      done();
    });

    it('should load a middleware folder with some files to ignore', (done) => {
      const middlewares = middlewareLoader(
        {
          appPath: '../test/resource/srcSample',
          middleware: {
            ignore: ['ignore.middleware.js'],
          },
        },
        servicesMock,
      );
      expect(middlewares).to.be.an('array');
      expect(middlewares).to.have.lengthOf(3); // *, path1 and path2
      expect(middlewares[0].path).to.equal('*');
      expect(middlewares[0].middlewareList).to.be.an('array');
      expect(middlewares[0].middlewareList).to.have.lengthOf(3);
      expect(middlewares[0].middlewareList[0]).to.be.a('function');
      expect(middlewares[0].middlewareList[1]).to.be.a('function');
      expect(middlewares[0].middlewareList[2]).to.be.a('function');
      expect(middlewares[1].path).to.equal('/path1');
      expect(middlewares[1].middlewareList).to.be.an('array');
      expect(middlewares[1].middlewareList).to.have.lengthOf(3);
      expect(middlewares[1].middlewareList[0]).to.be.a('function');
      expect(middlewares[1].middlewareList[1]).to.be.a('function');
      expect(middlewares[1].middlewareList[2]).to.be.a('function');
      expect(middlewares[2].path).to.equal('/path2');
      expect(middlewares[2].middlewareList).to.be.an('array');
      expect(middlewares[2].middlewareList).to.have.lengthOf(2);
      expect(middlewares[2].middlewareList[0]).to.be.a('function');
      expect(middlewares[2].middlewareList[1]).to.be.a('function');
      done();
    });

    it('should load a middleware folder different to the default one', (done) => {
      const middlewares = middlewareLoader(
        {
          appPath: '../test/resource/srcSample',
          middleware: {
            dir: 'middlewaresIgnore',
            ignore: [
              'ignore.middleware.js',
              'with-path-1.middleware.js',
              'with-path-2.middleware.js',
              'same-path-1.middleware.js',
              'same-path-2.middleware.js',
              'other-path-1.middleware.js',
            ],
          },
        },
        servicesMock,
      );
      expect(middlewares).to.be.an('array');
      expect(middlewares).to.have.lengthOf(1); // *
      expect(middlewares[0].path).to.equal('*');
      expect(middlewares[0].middlewareList).to.be.an('array');
      expect(middlewares[0].middlewareList).to.have.lengthOf(3);
      expect(middlewares[0].middlewareList[0]).to.be.a('function');
      expect(middlewares[0].middlewareList[2]).to.be.a('function');
      done();
    });
  });

  describe('Execution of middlewares', () => {
    let app;
    let router;

    before(() => {
      app = express();
      router = express.Router();
      app.use('/', router);
      // loading the middlewares
      middlewareLoader(
        {
          appPath: '../test/resource/srcSample',
          middleware: {
            ignore: ['ignore.middleware.js'],
          },
        },
        servicesMock,
      ).forEach((middlewareGroupList) => {
        router.use(middlewareGroupList.path, middlewareGroupList.middlewareList);
      });
      // loading a controller at different paths
      router.get('/status', (req, res) => {
        res.status(200).json({ callbacks: res.locals.callbacks });
      });
      router.get('/path1', (req, res) => {
        res.status(200).json({ callbacks: res.locals.callbacks });
      });
      router.get('/path2', (req, res) => {
        res.status(200).json({ callbacks: res.locals.callbacks });
      });
    });

    it('should load middlewares for ordered execution for all paths', (done) => {
      request(app)
      .get('/status')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('callbacks');
        expect(res.body.callbacks).to.be.an('array').and.have.lengthOf(2);
        expect(res.body.callbacks[0]).to.deep.equal({ text: 'TEXT-AUTH', middleware: 'auth' });
        expect(res.body.callbacks[1]).to.deep.equal({ text: 'TEXT-SAMPLE', middleware: 'sample' });
        done();
      });
    });

    it('should load middlewares for ordered execution for one path', (done) => {
      request(app)
      .get('/path1')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('callbacks');
        expect(res.body.callbacks).to.be.an('array').and.have.lengthOf(5);
        expect(res.body.callbacks[0]).to.deep.equal({ text: 'TEXT-AUTH', middleware: 'auth' });
        expect(res.body.callbacks[1]).to.deep.equal({ text: 'TEXT-SAMPLE', middleware: 'sample' });
        expect(res.body.callbacks[2]).to.deep.equal({ text: 'TEXT-1-1', middleware: 'path1-1' });
        expect(res.body.callbacks[3]).to.deep.equal({ text: 'TEXT-1-2', middleware: 'path1-2' });
        expect(res.body.callbacks[4]).to.deep.equal({ text: 'TEXT-1-3', middleware: 'path1-3' });
        done();
      });
    });

    it('should load middlewares for ordered execution for another path', (done) => {
      request(app)
      .get('/path2')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('callbacks');
        expect(res.body.callbacks).to.be.an('array').and.have.lengthOf(4);
        expect(res.body.callbacks[0]).to.deep.equal({ text: 'TEXT-AUTH', middleware: 'auth' });
        expect(res.body.callbacks[1]).to.deep.equal({ text: 'TEXT-SAMPLE', middleware: 'sample' });
        expect(res.body.callbacks[2]).to.deep.equal({ text: 'TEXT-2-1', middleware: 'path2-1' });
        expect(res.body.callbacks[3]).to.deep.equal({ text: 'TEXT-2-2', middleware: 'path2-2' });
        done();
      });
    });
  });
});
