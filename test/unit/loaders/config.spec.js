const path = require('path');
const fs = require('fs');
const { expect } = require('chai');

const config = require('../../../loaders/config');

describe('config Loader', () => {
  describe('load a config file', () => {
    it('should load a basic config file', (done) => {
      const configFile = config(path.resolve(__dirname, './srcSample'));
      expect(configFile).to.be.an('object');
      expect(configFile).to.have.property('appPath');
      expect(configFile).to.have.property('database');
      done();
    });
  });
});
