const { expect } = require('chai');
// NOTE: sequelize-mock is not working right, or at least it does not emulates a database state
// maybe a custom sequelize mock should be created or convert all these tests into integration ones
const SequelizeMock = require('sequelize-mock');
const crudController = require('../../../crud/crud-controller');

const dbMock = new SequelizeMock();

const withTransactionMock = (fun, isTransactional = true) => {
  return isTransactional ? dbMock.transaction(fun) : Promise.resolve(fun());
};

describe('CRUD Controller', () => {
  describe('Creating a crud controller', () => {
    it('should have default methods', (done) => {
      const bookCrudController = crudController(withTransactionMock);

      expect(bookCrudController).to.be.a('function');
      done();
    });
  });
});
