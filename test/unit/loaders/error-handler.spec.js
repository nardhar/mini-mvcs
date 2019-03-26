const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

class ApiError extends Error {
  constructor(type, message = '') {
    super(message);
    this.type = type;
    this.message = message;
    this.data = null;
  }

  getBody() {
    return this.data;
  }
}

class NotFoundError extends ApiError {
  constructor(objectName, filters, message = '') {
    super('NotFoundError', message || `${objectName} not found`);
    this.objectName = objectName;
    this.data = filters;
  }

  getBody() {
    return [{
      code: `${this.objectName}.notFound`,
      args: Object.keys(this.data).map((key) => {
        return { key, value: this.data[key] };
      }),
    }];
  }
}

class ValidationError extends ApiError {
  constructor(objectName, errors = []) {
    super('ValidationError', `Validation error with "${objectName}"`);
    this.objectName = objectName;
    this.data = errors;
  }

  getBody() {
    return this.data.map((error) => {
      return {
        field: error.field,
        code: `${this.objectName}.${error.field}.${error.code}`,
        args: error.args,
      };
    });
  }
}

class CustomError extends ApiError {
  constructor(objectName, data = {}, message = '') {
    super('CustomError', message || `${objectName} not found`);
    this.objectName = objectName;
    this.data = data;
  }

  getBody() {
    return this.data;
  }
}

rewiremock('../errors').with({
  ApiError,
  ValidationError,
  NotFoundError,
});

let errorHandler;
let result;
let resMock;

describe('Unit Testing error handler', () => {
  before(() => {
    rewiremock.enable();
    errorHandler = require('../../../src/loaders/error-handler');
  });

  beforeEach(() => {
    result = {};
    resMock = {
      headersSent: false,
      status(code) {
        result.code = code;
        return {
          json(data) {
            result.data = data;
          },
        };
      },
    };
  });

  after(() => { rewiremock.disable(); });

  describe('Default configuration', () => {
    it('should execute a default handler for a common error', (done) => {
      const err = new Error('Simple error');
      errorHandler()(err, {}, resMock, {});
      expect(result).to.have.property('code');
      expect(result).to.have.property('data');
      expect(result.code).to.equal(500);
      expect(result.data).to.deep.equal({ message: err.message, errors: [] });
      done();
    });

    it('should execute a default handler for a NotFoundError', (done) => {
      const err = new NotFoundError('Book', { id: 1 });
      errorHandler()(err, {}, resMock, {});
      expect(result).to.have.property('code');
      expect(result).to.have.property('data');
      expect(result.code).to.equal(404);
      expect(result.data).to.deep.equal({
        message: 'Book not found',
        errors: [{
          code: 'Book.notFound',
          args: [{ key: 'id', value: 1 }],
        }],
      });
      done();
    });

    it('should execute a default handler for a ValidationError', (done) => {
      const err = new ValidationError('Book', []);
      errorHandler()(err, {}, resMock, {});
      expect(result).to.have.property('code');
      expect(result).to.have.property('data');
      expect(result.code).to.equal(412);
      expect(result.data).to.deep.equal({
        message: 'Validation error with "Book"',
        errors: [],
      });
      done();
    });

    it('should handle a ValidationError with Errors', (done) => {
      const err = new ValidationError('Book', [
        { field: 'title', code: 'nullable', args: [] },
        { field: 'author', code: 'size', args: [3, 50] },
      ]);
      errorHandler()(err, {}, resMock, {});
      expect(result).to.have.property('code');
      expect(result).to.have.property('data');
      expect(result.code).to.equal(412);
      expect(result.data).to.deep.equal({
        message: 'Validation error with "Book"',
        errors: [
          { field: 'title', code: 'Book.title.nullable', args: [] },
          { field: 'author', code: 'Book.author.size', args: [3, 50] },
        ],
      });
      done();
    });
  });

  describe('Custom configuration', () => {
    it('should load a default logger', (done) => {
      const loggerResult = [];

      const err = new Error('Simple error');

      errorHandler({
        error: {
          logger(e) {
            loggerResult.push(e);
          },
        },
      })(err, {}, resMock, {});

      expect(loggerResult).to.be.an('array').and.to.have.lengthOf(1);
      expect(loggerResult[0].message).to.equal('Simple error');
      done();
    });

    it('should change the default status for an internal error', (done) => {
      const err = new Error('Simple error');

      errorHandler({
        error: {
          codes: {
            internal: 400,
          },
        },
      })(err, {}, resMock, {});

      expect(result.code).to.equal(400);
      done();
    });

    it('should change the default status for a NotFoundError', (done) => {
      const err = new NotFoundError('Book', { id: 1 });

      errorHandler({
        error: {
          codes: {
            NotFoundError: 204,
          },
        },
      })(err, {}, resMock, {});

      expect(result.code).to.equal(204);
      done();
    });

    it('should change the default status for a ValidationError', (done) => {
      const err = new ValidationError('Book', []);

      errorHandler({
        error: {
          codes: {
            ValidationError: 400,
          },
        },
      })(err, {}, resMock, {});

      expect(result.code).to.equal(400);
      done();
    });

    it('should change the default status for an ApiError', (done) => {
      const err = new ApiError('Other');

      errorHandler({
        error: {
          codes: {
            default: 412,
          },
        },
      })(err, {}, resMock, {});

      expect(result.code).to.equal(412);
      done();
    });

    it('should change the default renderer', (done) => {
      const err = new Error('Other');

      errorHandler({
        error: {
          renderer(e) {
            return { errorMessage: e.message, errorList: e.getBody() };
          },
        },
      })(err, {}, resMock, {});

      expect(result.data).to.deep.equal({ errorMessage: err.message, errorList: [] });
      done();
    });
  });

  describe('Custom Error throwing', () => {
    it('should execute a handle a CustomError', (done) => {
      const err = new CustomError('MyObject', { code: 'custom' }, 'Oops, Custom Error');
      errorHandler()(err, {}, resMock, {});
      expect(result.code).to.equal(400);
      expect(result.data).to.deep.equal({
        message: 'Oops, Custom Error',
        errors: { code: 'custom' },
      });
      done();
    });

    it('should execute a handle a CustomError with a custom status', (done) => {
      const err = new CustomError('MyObject', { code: 'custom' }, 'Oops, Custom Error');
      errorHandler({
        error: {
          codes: {
            CustomError: 405,
          },
        },
      })(err, {}, resMock, {});
      expect(result.code).to.equal(405);
      expect(result.data).to.deep.equal({
        message: 'Oops, Custom Error',
        errors: { code: 'custom' },
      });
      done();
    });
  });
});
