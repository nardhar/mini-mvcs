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
      'book.controller.js',
      'author.controller.js',
      'ignore.controller.js',
      'notacontroller.js',
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

const expressMock = () => {
  return {
    use(...args) {

    },
  };
};
expressMock.Router = () => {
  return {
    use(...args) {

    },
  };
};
rewiremock('express').with(expressMock);

let controllerLoader;

describe('Unit Testing CRUD Controller', () => {
  before(() => {
    rewiremock.enable();
    controllerLoader = require('../../../src/loaders/controller');
  });

  after(() => { rewiremock.disable(); });

  describe('Loading of default controllers folder', () => {

  });
});
