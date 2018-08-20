const path = require('path');
const { Op } = require('sequelize');
const { expect } = require('chai');

const config = require('../../../loaders/config');

describe('Unit Testing config Loader', () => {
  describe('load a config file', () => {
    it('should load a basic config file', (done) => {
      const configFile = config(path.resolve(__dirname, '../../resource/srcSample'));
      expect(configFile).to.be.an('object');
      expect(configFile).to.have.property('appPath');
      expect(configFile).to.have.property('database');
      expect(configFile.database).to.have.property('sync');
      expect(configFile.database.sync).to.have.property('force');
      expect(Boolean(configFile.database.sync.force)).to.be.a('Boolean');
      expect(configFile.database).to.have.property('operatorsAliases', Op);
      done();
    });
  });
});
