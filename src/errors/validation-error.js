const ApiError = require('./api-error');
const FieldError = require('./field-error');

class ValidationError extends ApiError {
  constructor(objectName, errors = []) {
    super('ValidationError', `Validation error with "${objectName}"`);
    this.objectName = objectName;
    // in case errors was null, then always use an array
    this.data = (errors || []).map((error) => {
      return error instanceof FieldError
        ? error
        : new FieldError(error.field || null, error.code || '', error.args || []);
    });
  }

  addFieldError(fieldError) {
    this.data.push(fieldError);
  }

  addError(field, code, args = []) {
    this.data.push(new FieldError(field, code, args));
  }

  hasErrors() {
    return this.data.length > 0;
  }

  getErrors() {
    return this.data;
  }

  merge(validationError) {
    validationError.data.forEach((error) => {
      this.addFieldError(error);
    });
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

module.exports = ValidationError;
