module.exports = (router, services) => {
  router.get('/author', (req, res, next) => {
    return Promise.resolve({ result: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });

  router.get('/author/:id', (req, res, next) => {
    return Promise.resolve({ result: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });

  router.post('/author', () => {
    return Promise.resolve({ result: true });
  });

  router.put('/author/:id', () => {
    return Promise.resolve({ result: true });
  });
};
