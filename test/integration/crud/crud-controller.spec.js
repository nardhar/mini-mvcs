// TODO: tests will not work because of not mocking templater that should replace express.Router()

const { expect } = require('chai');
const express = require('express');
const request = require('supertest');

// NOTE: sequelize-mock is not working right, or at least it does not emulates a database state
// maybe a custom sequelize mock should be created or convert all these tests into integration ones
const crudControllerDefinition = require('../../../src/crud/crud-controller');

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

describe('Unit Testing CRUD Controller', () => {
  const crudController = crudControllerDefinition(withTransactionMock);

  describe('Generation of default methods', () => {
    let app;
    let router;
    let requester;

    before(() => {
      app = express();

      router = express.Router();
      app.use('/', router);
      crudController('book', router, bookServiceMock);
      // actually we are testing this method, but we only know if it works by sending a request
      requester = request(app);
    });

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

  describe('Custom configurations', () => {
    let app;
    let router;

    // this time we reset the app and the router everytime
    beforeEach(() => {
      app = express();

      router = express.Router();
      app.use('/', router);
    });

    it('should respond responde normally to a get petition (index)', (done) => {
      crudController('book', router, bookServiceMock, ['index']);

      request(app)
      .get('/book')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('rows');
        expect(res.body).to.have.property('count');
        done();
      });
    });

    it('should not respond to a post method', (done) => {
      crudController('book', router, bookServiceMock, ['index']);

      request(app)
      .post('/book')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(404);
        done();
      });
    });

    it('should respond an index method transactionally', (done) => {
      crudController('book', router, bookServiceMock, [
        { method: 'index', transactional: true },
      ]);

      request(app)
      .get('/book')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('rows');
        expect(res.body).to.have.property('count');
        expect(res.body).to.have.property('wasTransactional', true);
        done();
      });
    });

    it('should respond an post method non transactionally', (done) => {
      crudController('book', router, bookServiceMock, [
        { method: 'post', transactional: false },
      ]);

      request(app)
      .post('/book')
      .end((err, res) => {
        if (err) done(err);
        expect(res.status).to.be.equals(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('title', 'my created little pony');
        expect(res.body).to.not.have.property('wasTransactional');
        done();
      });
    });
  });
});
