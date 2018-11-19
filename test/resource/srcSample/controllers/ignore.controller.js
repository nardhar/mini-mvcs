module.exports = (router) => {
  router.get('/author', (req, res, next) => {
    return Promise.resolve({ result: true })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
  });
};
