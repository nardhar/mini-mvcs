module.exports = (services) => {
  return {
    order: 10,
    callback: (req, res, next) => {
      return Promise.resolve({ result: true })
      .then(() => {
        next();
      })
      .catch(() => {
        next();
      });
    },
  };
};
