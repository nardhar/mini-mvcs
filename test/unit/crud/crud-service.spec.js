const { expect } = require('chai');

const { NotFoundError, ValidationError, FieldError } = require('../../../errors');

describe('errors Api', () => {
  describe('NotFoundError', () => {
    it('should create an instance', (done) => {
      const err = new NotFoundError('Object', { id: 1 });

      expect(err).to.be.an('error');
      expect(err).to.have.property('objectName');
      expect(err).to.have.property('filters');
      expect(err).to.have.property('message');
      expect(err.objectName).to.equal('Object');
      expect(err.filters).to.be.an.instanceof(Object);
      expect(err.filters).to.deep.equal({ id: 1 });
      expect(err.message).to.equal('Object not found');
      done();
    });

    it('should create an instance with a message', (done) => {
      const err = new NotFoundError('Object', { id: 1 }, 'Could not found Object with filters');

      expect(err).to.be.an('error');
      expect(err.message).to.deep.equal('Could not found Object with filters');
      done();
    });
  });
});
