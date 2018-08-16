const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const templater = require('../../../util/templater');

// NOTE: sequelize-mock is not working right, or at least it does not emulates a database state
// maybe a custom sequelize mock should be created or convert all these tests into integration ones
const crudControllerDefinition = require('../../../crud/crud-controller');

const withTransactionMock = (fun, isTransactional = true) => {
  return isTransactional
    ? fun().then((result) => { return { ...result, wasTransactional: true }; })
    : Promise.resolve(fun());
};

const bookServiceMock = {
  listAndCount() {
    return Promise.resolve({ rows: [], count: 0 });
  },
  read() {
    return Promise.resolve({ title: 'my little pony' });
  },
  save() {
    return Promise.resolve({ title: 'my created little pony' });
  },
  update() {
    return Promise.resolve({ title: 'my updated little pony' });
  },
  delete() {
    return Promise.resolve({ title: 'my deleted little pony' });
  },
};

describe('CRUD Controller', () => {
  const crudController = crudControllerDefinition(withTransactionMock);

  describe('Creating a default crud controller', () => {
    let app;
    let router;
    let requester;

    before(() => {
      app = express();
      router = express.Router();
      app.use(templater);
      app.use('/', router);

      // actually we are testing this method, but we only know if it works by sending a request
      crudController('book', router, bookServiceMock);
      requester = request(app);
    });

    describe('Generation of default methods', () => {
      it('should respond an index method', (done) => {
        requester
        .get('/book')
        .end((err, res) => {
          if (err) done(err);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('rows');
          expect(res.body).to.have.property('count');
          expect(res.body).to.not.have.property('wasTransactional');
          expect(res.status).to.be.equals(200);
          done();
        });
      });

      it('should respond a get method', (done) => {
        requester
        .get('/book/1')
        .end((err, res) => {
          if (err) done(err);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('title', 'my little pony');
          expect(res.body).to.not.have.property('wasTransactional');
          expect(res.status).to.be.equals(200);
          done();
        });
      });

      it('should respond a post method', (done) => {
        requester
        .post('/book')
        .end((err, res) => {
          if (err) done(err);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('title', 'my created little pony');
          expect(res.body).to.have.property('wasTransactional', true);
          expect(res.status).to.be.equals(201);
          done();
        });
      });

      it('should respond a put method', (done) => {
        requester
        .put('/book/1')
        .end((err, res) => {
          if (err) done(err);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('title', 'my updated little pony');
          expect(res.body).to.have.property('wasTransactional', true);
          expect(res.status).to.be.equals(200);
          done();
        });
      });

      it('should respond a delete method', (done) => {
        requester
        .delete('/book/1')
        .end((err, res) => {
          if (err) done(err);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('title', 'my deleted little pony');
          expect(res.body).to.have.property('wasTransactional', true);
          expect(res.status).to.be.equals(200);
          done();
        });
      });
    });
  });
});
