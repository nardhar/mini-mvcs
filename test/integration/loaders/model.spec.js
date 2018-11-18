const path = require('path');
const { expect } = require('chai');

const modelLoader = require('../../../src/loaders/model');

/**
 * Testing the models loader, the database params are not actually used, it is just for creating
 * the sequelize instance without syncing it
 */
describe('Integration Testing model Loader', () => {
  describe('load a models folder', () => {
    const modelPath = path.resolve(__dirname, '../../resource/srcSample');

    it('should load a models folder with default options', (done) => {
      const models = modelLoader({
        appPath: modelPath,
        database: {
          username: 'postgres',
          password: 'postgres',
          database: 'mini-mvcs-test',
          host: '127.0.0.1',
          port: 5432,
          dialect: 'postgres',
          logging: false,
          pool: {
            max: 15,
            min: 1,
            idle: 10000,
          },
          sync: { force: true },
          define: {
            underscored: true,
            freezeTableName: true,
          },
        },
      });
      expect(models).to.be.an('object');
      expect(models).to.have.property('sequelize');
      expect(models).to.have.property('Book');
      expect(models).to.have.property('Author');
      // the models should be associated
      expect(models.Book).to.have.property('associations');
      expect(models.Author).to.have.property('associations');
      // to each other
      expect(models.Book.associations).to.have.property('Author');
      expect(models.Author.associations).to.have.property('Books');
      done();
    });

    it('should load a models folder with suffix in their name', (done) => {
      const models = modelLoader({
        appPath: modelPath,
        database: {
          username: 'postgres',
          password: 'postgres',
          database: 'mini-mvcs-test',
          host: '127.0.0.1',
          port: 5432,
          dialect: 'postgres',
          logging: false,
          pool: {
            max: 15,
            min: 1,
            idle: 10000,
          },
          sync: { force: true },
          define: {
            underscored: true,
            freezeTableName: true,
          },
        },
        model: {
          dir: 'modelsSuffix',
          suffix: '.model',
        },
      });
      expect(models).to.be.an('object');
      expect(models).to.have.property('sequelize');
      expect(models).to.have.property('Book');
      expect(models).to.have.property('Author');
      // the models should be associated
      expect(models.Book).to.have.property('associations');
      expect(models.Author).to.have.property('associations');
      // to each other
      expect(models.Book.associations).to.have.property('Author');
      expect(models.Author.associations).to.have.property('Books');
      done();
    });

    it('should load a models folder with some to be ignored', (done) => {
      const models = modelLoader({
        appPath: modelPath,
        database: {
          username: 'postgres',
          password: 'postgres',
          database: 'mini-mvcs-test',
          host: '127.0.0.1',
          port: 5432,
          dialect: 'postgres',
          logging: false,
          pool: {
            max: 15,
            min: 1,
            idle: 10000,
          },
          sync: { force: true },
          define: {
            underscored: true,
            freezeTableName: true,
          },
        },
        model: {
          dir: 'modelsIgnore',
          ignore: ['author2.js'],
        },
      });
      expect(models).to.be.an('object');
      expect(models).to.have.property('sequelize');
      expect(models).to.have.property('Book');
      expect(models).to.have.property('Author');
      // the models should be associated
      expect(models.Book).to.have.property('associations');
      expect(models.Author).to.have.property('associations');
      // to each other
      expect(models.Book.associations).to.have.property('Author');
      expect(models.Author.associations).to.have.property('Books');
      done();
    });
  });
});
