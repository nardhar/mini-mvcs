const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
});
rewiremock('./config').with({
});
rewiremock('sequelize').with({
  Op: 'sequelize.Op',
});

let config;

describe('Unit Testing config Loader', () => {
  before(() => {
    rewiremock.enable();
    config = require('../../../loaders/config');
  });

  after(() => { rewiremock.disable(); });

  describe('load a config file', () => {
    it('should load a basic config file', (done) => {
      const configFile = config('.');
      expect(configFile).to.be.an('object');
      expect(configFile).to.have.property('appPath');
      expect(configFile).to.have.property('database');
      expect(configFile.database).to.have.property('sync');
      expect(configFile.database.sync).to.have.property('force');
      expect(Boolean(configFile.database.sync.force)).to.be.a('Boolean');
      expect(configFile.database).to.have.property('operatorsAliases', 'sequelize.Op');
      done();
    });
  });
});
