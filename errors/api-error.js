// abstract
class ApiError extends Error {
  constructor(type, message = '') {
    super(message);
    this.type = type;
    this.message = message;
    // data will be the property sent to the renderer
    this.data = null;
    Error.captureStackTrace(this, this.constructor);
  }

  getBody() {
    return this.data;
  }
}

module.exports = ApiError;
