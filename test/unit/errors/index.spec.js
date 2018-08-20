const { expect } = require('chai');

const { NotFoundError, ValidationError, FieldError } = require('../../../errors');

describe('Unit Testing errors Api', () => {
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

  describe('ValidationError', () => {
    it('should create an instance without errors', (done) => {
      const err = new ValidationError('Object');

      expect(err).to.be.an('error');
      expect(err).to.have.property('objectName');
      expect(err).to.have.property('errors');
      expect(err).to.have.property('message');
      expect(err.hasErrors()).to.equal(false);
      expect(err.objectName).to.equal('Object');
      expect(err.message).to.equal('Validation error with "Object"');
      expect(err.errors).to.be.an.instanceof(Array);
      expect(err.errors).to.have.length(0);
      done();
    });

    it('should create an instance with errors', (done) => {
      const err = new ValidationError('Object', [
        new FieldError('sampleField', 'sampleCode'),
      ]);

      expect(err).to.be.an('error');
      expect(err).to.have.property('objectName');
      expect(err).to.have.property('errors');
      expect(err).to.have.property('message');
      expect(err.hasErrors()).to.equal(true);
      expect(err.objectName).to.equal('Object');
      expect(err.message).to.equal('Validation error with "Object"');
      expect(err.errors).to.be.an.instanceof(Array);
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.have.property('field');
      expect(err.errors[0]).to.have.property('code');
      expect(err.errors[0]).to.have.property('args');
      expect(err.errors[0].field).to.equal('sampleField');
      expect(err.errors[0].code).to.equal('sampleCode');
      expect(err.errors[0].args).to.be.an.instanceof(Array);
      expect(err.errors[0].args).to.have.length(0);
      done();
    });

    it('should create an instance and add errors later', (done) => {
      const err = new ValidationError('Object');
      expect(err).to.be.an('error');
      expect(err.hasErrors()).to.equal(false);

      // one way
      err.addError('sampleField', 'sampleCode');
      expect(err.hasErrors()).to.equal(true);
      expect(err.errors).to.have.length(1);

      // or another
      err.addFieldError(new FieldError('sampleField', 'sampleCode'));
      expect(err.hasErrors()).to.equal(true);
      expect(err.errors).to.have.length(2);

      done();
    });

    it('should merge the errors of two instances', (done) => {
      const err1 = new ValidationError('Object', [
        new FieldError('sampleField1', 'sampleCode1'),
      ]);
      const err2 = new ValidationError('Object', [
        new FieldError('sampleField2', 'sampleCode2'),
      ]);

      err1.merge(err2);

      expect(err1.hasErrors()).to.equal(true);
      expect(err1.errors).to.have.length(2);

      expect(err1.errors[0].field).to.equal('sampleField1');
      expect(err1.errors[0].code).to.equal('sampleCode1');
      expect(err1.errors[1].field).to.equal('sampleField2');
      expect(err1.errors[1].code).to.equal('sampleCode2');

      done();
    });
  });
});
