const ApiError = require('./api-error');

class NotFoundError extends ApiError {
  constructor(objectName, filters, message = '') {
    super(
      'NotFoundError',
      // message || `${objectName} con filtros "${filters}" no encontrado/a`,
      message || `${objectName} no encontrado(a)`,
    );
    this.objectName = objectName;
    this.filters = filters;
  }
}

module.exports = NotFoundError;
