module.exports = (models) => {
  return (fun, isTransactional = true) => {
    return isTransactional ? models.sequelize.transaction(fun) : Promise.resolve(fun());
  };
};
