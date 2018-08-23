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
rewiremock('../services/book.service').with((services, models) => {
  return {
    save(params) {
      return models.Book.save(params);
    },
    saveAuthor(params) {
      return services.author.save(params);
    },
  };
});
rewiremock('../services/author.service').with((services, models) => {
  return {
    save(params) {
      return models.Author.save(params);
    },
  };
});

const modelsMock = {
  Author: {
    save(params) {
      return { action: 'save', params };
    },
  },
  Book: {
    save(params) {
      return { action: 'save', params };
    },
  },
};

let serviceLoader;

describe('Unit Testing service Loader', () => {
  before(() => {
    rewiremock.enable();
    serviceLoader = require('../../../loaders/service');
  });

  after(() => { rewiremock.disable(); });

  describe('Loading of services', () => {
    it('should build a basic service folder', (done) => {
      const services = serviceLoader(
        {
          // since rewiremock only mocks existing modules we need to create the same file structure
          // for importing the dynamically called services with require, even though they will be
          // mocked here. Note: appPath must be relative to loaders/service
          appPath: '../test/resource/srcSample',
        },
        modelsMock,
      );
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      done();
    });
  });
});
