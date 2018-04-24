const { sequelize } = require('../loaders/model');

module.exports = (fun, isTransactional = true) => {
  return isTransactional ? sequelize.transaction(fun) : Promise.resolve(fun());
};
