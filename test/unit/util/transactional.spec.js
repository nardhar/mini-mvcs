const { expect } = require('chai');

const transactional = require('../../../src/util/transactional');

const withTransaction = transactional({
  // mocking sequelize transactionallity
  sequelize: {
    transaction(callback) {
      return callback()
      .then((result) => {
        // by adding a property to the callback result
        return { ...result, wasTransactional: true };
      });
    },
  },
});

describe('Unit Testing Transactional Util module', () => {
  it('should execute a function transactionally by default', (done) => {
    withTransaction(() => {
      return Promise.resolve({});
    })
    .then((result) => {
      expect(result).to.be.an('object');
      expect(result).to.have.property('wasTransactional');
      done();
    });
  });

  it('should execute a function non transactionally if false is sent', (done) => {
    withTransaction(() => {
      return Promise.resolve({});
    }, false)
    .then((result) => {
      expect(result).to.be.an('object');
      expect(result).to.not.have.property('wasTransactional');
      done();
    });
  });

  it('should execute a function transactionally if true is sent', (done) => {
    withTransaction(() => {
      return Promise.resolve({});
    }, true)
    .then((result) => {
      expect(result).to.be.an('object');
      expect(result).to.have.property('wasTransactional');
      done();
    });
  });
});
