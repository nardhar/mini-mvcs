class FieldError {
  constructor(field, code, args = []) {
    this.field = field;
    this.code = code;
    this.args = args;
  }
}

module.exports = FieldError;
