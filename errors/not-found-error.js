const ApiError = require('./api-error');

class NotFoundError extends ApiError {
  constructor(objectName, filters, message = '') {
    super(
      'NotFoundError',
      // message || `${objectName} with filters "${filters}" not found`,
      message || `${objectName} not found`,
    );
    this.objectName = objectName;
    this.filters = filters;
  }
}

module.exports = NotFoundError;
