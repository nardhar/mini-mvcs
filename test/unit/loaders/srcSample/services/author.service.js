module.exports = (services, models) => {
  return {
    list: (params) => {
      return models.Author.list(params);
    },
  };
};
