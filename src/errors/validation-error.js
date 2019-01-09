const { ValidationError: SequelizeValidationError } = require('sequelize');
const ApiError = require('./api-error');
const FieldError = require('./field-error');

class ValidationError extends ApiError {
  constructor(objectName, errors = []) {
    super('ValidationError', `Validation error with "${objectName}"`);
    this.objectName = objectName;
    // in case errors was null, then always use an array
    if (errors === null || Array.isArray(errors)) {
      this.data = (errors || []).map((error) => {
        return error instanceof FieldError
          ? error
          : new FieldError(error.field || null, error.code || '', error.args || []);
      });
    } else if (errors instanceof SequelizeValidationError) {
      // errors.errors is an Array of sequelize.ValidationErrorItem
      this.data = (errors.errors || []).map((err) => {
        return new FieldError(
          // TODO: check if path is the actual field
          err.path,
          // TODO: check if validatorKey is a i18n code for building the fieldError
          err.validatorKey,
          // TODO: check for all posible values of err.validatorArgs
          (err.value ? [err.value] : []).concat(err.validatorArgs),
        );
      });
    } else {
      this.data = [];
    }
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
