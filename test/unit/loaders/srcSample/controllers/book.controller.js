module.exports = (router, services) => {
  router.get('/book', (req, res, next) => {
    return Promise.resolve({ result: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });

  router.get('/book/:id', (req, res, next) => {
    return Promise.resolve({ result: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });
};
