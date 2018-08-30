const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

let controllerLoader;

describe('Unit Testing error handler', () => {
  before(() => {
    rewiremock.enable();
    controllerLoader = require('../../../loaders/controller');
  });

  after(() => { rewiremock.disable(); });

  describe('Loading of default controllers folder', () => {

  });
});
