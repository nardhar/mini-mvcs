const ApiError = require('./api-error');
const FieldError = require('./field-error');

class ValidationError extends ApiError {
  constructor(objectName, errors = []) {
    super('ValidationError', `Error de Validación de "${objectName}"`);
    this.objectName = objectName;
    this.errors = errors;
  }

  addFieldError(fieldError) {
    this.errors.push(fieldError);
  }

  addError(field, code, args = []) {
    this.errors.push(new FieldError(field, code, args));
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  merge(validationError) {
    validationError.errors.forEach((error) => {
      this.addFieldError(error);
    });
  }
}

module.exports = ValidationError;
