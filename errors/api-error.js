// abstract
class ApiError extends Error {
  constructor(type, message = '') {
    super(message);
    this.type = type;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
