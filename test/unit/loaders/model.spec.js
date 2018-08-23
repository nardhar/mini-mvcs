const path = require('path');
const { expect } = require('chai');
const rewiremock = require('rewiremock').default;
const SequelizeStub = require('./Sequelize.stub');

rewiremock('path').with({
  resolve(...args) {
    return args.join('/');
  },
  sep: path.sep,
});
rewiremock('sequelize').with(SequelizeStub);
rewiremock('../util/file').with({
  loaddirSync(folder, suffix, ignore) {
    return [
      'book.model.js',
      'author.model.js',
      'isbn.model.js',
      'tag.model.js',
      'ignore.model.js',
      'notamodel.js',
    ]
    .map((file) => {
      return { file, path: path.resolve(folder, file) };
    })
    .filter((file) => {
      return file.file.slice(-suffix.length) === suffix && ignore.indexOf(file.file) < 0;
    });
  },
});

let modelLoader;

describe('Unit Testing model Loader', () => {
  before(() => {
    rewiremock.enable();
    modelLoader = require('../../../loaders/model');
  });

  after(() => { rewiremock.disable(); });

  describe('load a model file', () => {
    it('should load a basic model file', (done) => {
      const db = modelLoader({
        database: { database: 'test', username: 'user', password: 'pass' },
        appPath: '.',
      });
      expect(db).to.be.an('object');
      expect(db).to.have.property('sequelize');
      expect(db).to.have.property('Sequelize');
      expect(db).to.have.property('Book');
      expect(db).to.have.property('Author');
      expect(db).to.have.property('Isbn');
      expect(db).to.have.property('Tag');
      expect(db).to.have.property('Ignore');
      expect(db).to.have.property('Notamodel');
      done();
    });

    it('should use only .model suffixed files', (done) => {
      const db = modelLoader({
        database: { database: 'test', username: 'user', password: 'pass' },
        appPath: '.',
        model: {
          suffix: '.model',
        },
      });
      expect(db).to.be.an('object');
      expect(db).to.have.property('sequelize');
      expect(db).to.have.property('Sequelize');
      expect(db).to.have.property('Book');
      expect(db).to.have.property('Author');
      expect(db).to.have.property('Isbn');
      expect(db).to.have.property('Tag');
      expect(db).to.have.property('Ignore');
      expect(db).to.not.have.property('Notamodel');
      done();
    });

    it('should ignore certain files, even if suffixed properly', (done) => {
      const db = modelLoader({
        database: { database: 'test', username: 'user', password: 'pass' },
        appPath: '.',
        model: {
          suffix: '.model',
          ignore: ['ignore.model.js'],
        },
      });
      expect(db).to.be.an('object');
      expect(db).to.have.property('sequelize');
      expect(db).to.have.property('Sequelize');
      expect(db).to.have.property('Book');
      expect(db).to.have.property('Author');
      expect(db).to.have.property('Isbn');
      expect(db).to.have.property('Tag');
      expect(db).to.not.have.property('Ignore');
      expect(db).to.not.have.property('Notamodel');
      done();
    });
  });

  describe('assiociation tests', () => {
    // not testing importing a definition model again
    let db;
    before(() => {
      db = modelLoader({
        database: { database: 'test', username: 'user', password: 'pass' },
        appPath: '.',
        model: { suffix: '.model' },
      });
    });

    // and using the following model for testing (which it is in the stub)
    // Author.hasMany(Book)
    // Book.belongsTo(Author)
    // Book.hasOne(Isbn)
    // Isbn.belongsTo(Book)
    // Book.belongsToMany(Tag)
    // Tag.belongsToMany(Book)
    // Notamodel does not have any relationships

    it('should load a model that only has a hasMany association', (done) => {
      expect(db.Author).to.have.property('hasManyModels');
      expect(db.Author.hasManyModels).to.be.an('Array').and.to.have.length(1);
      expect(db.Author.hasManyModels).to.deep.include({
        model: db.Book, options: { as: 'books' },
      });
      // no other associations were executed
      ['belongsToModels', 'hasOneModels', 'belongsToManyModels'].forEach((assoc) => {
        expect(db.Author[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });

    it('should load a model that only has a belongsTo association', (done) => {
      expect(db.Isbn).to.have.property('belongsToModels');
      expect(db.Isbn.belongsToModels).to.be.an('Array').and.to.have.length(1);
      expect(db.Isbn.belongsToModels).to.deep.include({
        model: db.Book, options: { as: 'book' },
      });
      // no other associations were executed
      ['belongsToManyModels', 'hasOneModels', 'hasManyModels'].forEach((assoc) => {
        expect(db.Isbn[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });

    it('should load a model that only has a belongsToMany association', (done) => {
      expect(db.Tag).to.have.property('belongsToManyModels');
      expect(db.Tag.belongsToManyModels).to.be.an('Array').and.to.have.length(1);
      expect(db.Tag.belongsToManyModels).to.deep.include({
        model: db.Book, options: { as: 'bookTags' },
      });
      // no other associations were executed
      ['belongsToModels', 'hasOneModels', 'hasManyModels'].forEach((assoc) => {
        expect(db.Tag[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });

    it('should load a model that has belongsTo, hasOne and belongsToMany associations', (done) => {
      expect(db.Book).to.have.property('belongsToModels');
      expect(db.Book.belongsToModels).to.be.an('Array').and.to.have.length(1);
      expect(db.Book.belongsToModels).to.deep.include({
        model: db.Author, options: { as: 'author' },
      });
      expect(db.Book).to.have.property('hasOneModels');
      expect(db.Book.hasOneModels).to.be.an('Array').and.to.have.length(1);
      expect(db.Book.hasOneModels).to.deep.include({
        model: db.Isbn, options: { as: 'isbn' },
      });
      expect(db.Book).to.have.property('belongsToManyModels');
      expect(db.Book.belongsToManyModels).to.be.an('Array').and.to.have.length(1);
      expect(db.Book.belongsToManyModels).to.deep.include({
        model: db.Tag, options: { as: 'bookTags' },
      });
      // no hasMany association was executed
      expect(db.Book.hasManyModels).to.be.an('Array').and.to.have.length(0);
      done();
    });

    it('should load a model with no associations at all', (done) => {
      expect(db.Ignore).to.have.property('belongsToModels');
      expect(db.Ignore).to.have.property('belongsToManyModels');
      expect(db.Ignore).to.have.property('hasOneModels');
      expect(db.Ignore).to.have.property('hasManyModels');
      [
        'belongsToManyModels',
        'belongsToModels',
        'hasOneModels',
        'hasManyModels',
      ].forEach((assoc) => {
        expect(db.Ignore[assoc]).to.be.an('Array').and.to.have.length(0);
      });
      done();
    });
  });
});
