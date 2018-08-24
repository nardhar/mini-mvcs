const ApiError = require('./api-error');

class NotFoundError extends ApiError {
  constructor(objectName, filters, message = '') {
    super('NotFoundError', message || `${objectName} not found`);
    this.objectName = objectName;
    this.data = this.filters;
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

module.exports = NotFoundError;
