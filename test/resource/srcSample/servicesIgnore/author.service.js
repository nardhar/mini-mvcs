module.exports = (services, models) => {
  return {
    list: (params) => {
      return models.Book.list(params);
    },
  };
};
