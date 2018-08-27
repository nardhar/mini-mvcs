const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

class ApiError {
  constructor(type, message = '') {
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

rewiremock('../errors').with({
  ApiError,
  ValidationError,
  NotFoundError,
});

let errorHandler;

describe('Unit Testing error handler', () => {
  before(() => {
    rewiremock.enable();
    errorHandler = require('../../../loaders/error-handler');
  });

  let resMock;
  let result;

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

  it('should execute a default handler for a common error', (done) => {
    const err = new Error('Simple error');
    errorHandler({})(err, {}, resMock, {});
    expect(result).to.have.property('code');
    expect(result).to.have.property('data');
    expect(result.code).to.equal(500);
    expect(result.data).to.deep.equal({ message: 'Internal Server Error', errors: [] });
    done();
  });

  it('should execute a default handler for a NotFoundError', (done) => {
    const err = new NotFoundError('Book', { id: 1 });
    errorHandler({})(err, {}, resMock, {});
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
    errorHandler({})(err, {}, resMock, {});
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
    errorHandler({})(err, {}, resMock, {});
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
