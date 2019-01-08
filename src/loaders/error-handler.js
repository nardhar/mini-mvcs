const { ApiError } = require('../errors');

module.exports = (config = {}) => {
  // loading a not so simple error handler
  const configError = config.error || {};
  // loads the configured logger or a simple default one (console.error)
  const configErrorLogger = configError.logger || console.error; // eslint-disable-line no-console
  // loads the configured error status codes
  // (if a custom error is created then it should be added in the error.codes section, document it!)
  const configErrorCodes = configError.codes || {};
  // ...for merging with the default ones
  const errorCodes = {
    ...{
      ValidationError: 412,
      NotFoundError: 404,
      default: 400,
      internal: 500,
    },
    ...configErrorCodes,
  };

  // loads the configured error renderer or uses a simple default one
  const errorRenderer = configError.renderer || ((err) => {
    return { message: err.message, errors: err.getBody() };
  });
  // NOTE: we could check if errorRenderer is a function

  // it returns a really simple middleware error
  return (err, req, res, next) => { // eslint-disable-line no-unused-vars
    // it always logs the errors
    configErrorLogger(err);

    // if no response has already been sent
    if (!res.headersSent) {
      // checks if it is a controlled error
      if (err instanceof ApiError) {
        // and finds the corresponding status code for the response
        res.status(errorCodes[err.type] || errorCodes.default).json(errorRenderer(err));
      } else {
        // if it is not a controlled error, then send a Server error
        // (some code has thrown an exception)
        res.status(errorCodes.internal).json(errorRenderer({
          message: err.message || 'Internal Server Error',
          getBody() { return []; },
        }));
      }
    }
  };
};
