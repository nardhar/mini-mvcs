const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
});
rewiremock('./config').with({
  test: {
    api: 'path',
    port: 8080,
    nested: {
      prop1: 1,
      more: {
        prop2: 2,
      },
    },
    database: {
      username: 'u',
    },
  },
});
rewiremock('sequelize').with({});

let config;

describe('Unit Testing config Loader', () => {
  before(() => {
    rewiremock.enable();
    config = require('../../../src/loaders/config');
  });

  after(() => { rewiremock.disable(); });

  describe('load a config file', () => {
    it('should load a basic config file', (done) => {
      const appPath = '.';
      const configFile = config(appPath);
      expect(configFile).to.be.an('object');
      expect(configFile).to.have.property('appPath', appPath);
      expect(configFile).to.have.property('database');
      expect(configFile.database).to.have.property('sync');
      expect(configFile.database.sync).to.have.property('force');
      expect(Boolean(configFile.database.sync.force)).to.be.a('Boolean');
      // check for loading of config file
      expect(configFile).to.have.property('api', 'path');
      expect(configFile).to.have.property('port', 8080);
      expect(configFile).to.have.property('nested');
      expect(configFile.nested).to.have.property('prop1', 1);
      expect(configFile.nested).to.have.property('more');
      expect(configFile.nested.more).to.have.property('prop2', 2);
      // that config.database merges correctly
      expect(configFile.database).to.have.property('username', 'u');
      done();
    });
  });
});
