const path = require('path');
const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
  sep: path.sep,
});
rewiremock('../util/file').with({
  loaddirSync(folder, suffix, ignore) {
    return [
      'book.service.js',
      'author.service.js',
      'ignore.service.js',
      'notaservice.js',
    ]
    .map((file) => {
      return { file, path: `${folder}/${file}` };
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
rewiremock('../../test/resource/srcSample/services/book.service').with((services, models) => {
  return {
    save(params) {
      return models.Book.save(params);
    },
    saveAuthor(params) {
      return services.author.save(params);
    },
  };
});
rewiremock('../../test/resource/srcSample/services/author.service').with((services, models) => {
  return {
    save(params) {
      return models.Author.save(params);
    },
  };
});

const modelsMock = {
  Author: {
    save(params) {
      return { model: 'Author', action: 'save', params };
    },
  },
  Book: {
    save(params) {
      return { model: 'Book', action: 'save', params };
    },
  },
};

let serviceLoader;

describe('Unit Testing service Loader', () => {
  before(() => {
    rewiremock.enable();
    serviceLoader = require('../../../src/loaders/service');
  });

  after(() => { rewiremock.disable(); });

  describe('Loading of services', () => {
    it('should load a default service folder', (done) => {
      const services = serviceLoader(
        {
          // since rewiremock only mocks existing modules we need to create the same file structure
          // for importing the dynamically called services with require, even though they will be
          // mocked here. Note: appPath must be relative to src/loaders/service
          appPath: '../../test/resource/srcSample',
        },
        modelsMock,
      );
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services).to.have.property('ignore');
      done();
    });

    it('should load a service folder with a custom suffix', (done) => {
      const services = serviceLoader(
        {
          appPath: '../../test/resource/srcSample',
          service: {
            suffix: 'service', // without a .
          },
        },
        modelsMock,
      );
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services).to.have.property('ignore');
      expect(services).to.have.property('notaservice');
      done();
    });

    it('should load a service folder with some files to ignore', (done) => {
      const services = serviceLoader(
        {
          appPath: '../../test/resource/srcSample',
          service: {
            ignore: ['ignore.service.js'],
          },
        },
        modelsMock,
      );
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services).to.not.have.property('ignore');
      done();
    });

    it('should load a service folder different to the default one', (done) => {
      const services = serviceLoader(
        {
          appPath: '../../test/resource/srcSample',
          service: {
            dir: 'servicesIgnore',
            ignore: ['ignore.service.js'],
          },
        },
        modelsMock,
      );
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services).to.not.have.property('ignore');
      expect(services).to.not.have.property('author2');
      done();
    });
  });

  describe('Execution of services', () => {
    it('should load services for execution', (done) => {
      const services = serviceLoader(
        {
          appPath: '../../test/resource/srcSample',
          service: {
            ignore: ['ignore.service.js'],
          },
        },
        modelsMock,
      );
      expect(services).to.be.an('object');

      // author service
      expect(services.author).to.have.property('save');
      expect(services.author.save).to.be.a('function');
      const authorSaveParams = { name: 'sample' };
      const authorServiceResult = services.author.save(authorSaveParams);
      expect(authorServiceResult).to.have.property('action', 'save');
      expect(authorServiceResult).to.have.property('model', 'Author');
      expect(authorServiceResult).to.have.property('params', authorSaveParams);

      // book service
      expect(services.book).to.have.property('save');
      expect(services.book).to.have.property('saveAuthor');
      expect(services.book.save).to.be.a('function');
      const bookSaveParams = { title: 'sample' };
      const bookServiceResult = services.book.save(bookSaveParams);
      expect(bookServiceResult).to.have.property('action', 'save');
      expect(bookServiceResult).to.have.property('model', 'Book');
      expect(bookServiceResult).to.have.property('params', bookSaveParams);
      const bookServiceSaveAuthorResult = services.book.saveAuthor(authorSaveParams);
      expect(bookServiceSaveAuthorResult).to.have.property('action', 'save');
      expect(bookServiceSaveAuthorResult).to.have.property('model', 'Author');
      expect(bookServiceSaveAuthorResult).to.have.property('params', authorSaveParams);

      done();
    });
  });
});
