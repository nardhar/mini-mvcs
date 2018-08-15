const { expect } = require('chai');
// NOTE: sequelize-mock is not working right, or at least it does not emulates a database state
// maybe a custom sequelize mock should be created or convert all these tests into integration ones
const crudControllerDefinition = require('../../../crud/crud-controller');

const withTransactionMock = (fun, isTransactional = true) => {
  return isTransactional ? Promise.resolve(fun()) : Promise.resolve(fun());
};

const crudController = crudControllerDefinition(withTransactionMock);

describe('CRUD Controller', () => {
  describe('Creating a default crud controller', () => {
    it('should have default methods', (done) => {
      const bookCrudController = crudController('book', router, bookServiceMock);
      expect(bookCrudController).to.be.a('function');
      done();
    });
  });
});
