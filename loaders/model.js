const path = require('path');
const Sequelize = require('sequelize');
const config = require('./config');
const fileUtil = require('../util/file');

const db = {};

const fakeDb = {};

// the order to execute associations
const associationList = {
  belongsTo: [],
  hasOne: [],
  belongsToMany: [],
  hasMany: [],
};

const sequelize = config.database.use_env_variable
  ? new Sequelize(process.env[config.database.use_env_variable], config.database.database)
  : new Sequelize(config.database.database, config.database.username, config.database.password, config.database);

fileUtil.loaddirSync(
  config.model.dir || `${__dirname}/../../../models`,
  config.model.suffix || '.js',
  config.model.ignore || [],
  (err, file, filePath) => {
    const model = sequelize['import'](filePath);
    db[model.name] = model;
    // building the fake associator
    fakeDb[model.name] = Object.keys(associationList).reduce((acc, associationType) => {
      return Object.assign({}, acc, {
        [associationType]: (model2, options) => {
          associationList[associationType].push({
            model1: model.name,
            model2: model2.name,
            options,
          });
        },
      });
    }, {});
    // fakeDb[model.name] = {
    //   belongsTo: (otherModel, options) => {
    //     associationList.belongsTo.push({ model1: model.name, model2: otherModel.name, options });
    //   },
    //   hasOne: (otherModel, options) => {
    //     associationList.hasOne.push({ model1: model.name, model2: otherModel.name, options });
    //   },
    //   belongsToMany: (otherModel, options) => {
    //     associationList.belongsToMany.push({ model1: model.name, model2: otherModel.name, options });
    //   },
    //   hasMany: (otherModel, options) => {
    //     associationList.hasMany.push({ model1: model.name, model2: otherModel.name, options });
    //   },
    // };
  },
);

// plain old associator
// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    // sending fakeDb so it only adds the association's definition to associationList key array
    db[modelName].associate(fakeDb);
  }
});

// and now we associate the models
// by associating in order we make sure no additional keys are created when a hasMany
// association is called before a belongsTo one
Object.keys(associationList).forEach((associationType) => {
  associationList[associationType].forEach((association) => {
    db[association.model1][associationType](db[association.model2], association.options);
  });
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
