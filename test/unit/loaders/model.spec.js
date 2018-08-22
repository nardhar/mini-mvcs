const path = require('path');
const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
  sep: path.sep,
});
rewiremock('sequelize').by('./Sequelize.stub');
rewiremock('../util/file').with({
  loaddirSync(folder, suffix, ignore) {
    return [
      'book.model.js',
      'author.model.js',
      'isbn.model.js',
      'tag.model.js',
      'ignore.model.js',
    ]
    .map((file) => {
      return { file, path: path.resolve(folder, file) };
    })
    .filter((file) => {
      return file.file.slice(-suffix.length) === suffix && ignore.indexOf(file.file) < 0;
    });
  },
});

let model;

describe('Unit Testing config Loader', () => {
  before(() => {
    rewiremock.enable();
    model = require('../../../loaders/model');
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
      expect(configFile.database).to.have.property('operatorsAliases', 'sequelize.Op');
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
