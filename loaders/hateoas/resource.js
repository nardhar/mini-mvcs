/* eslint-disable no-underscore-dangle */
const SequelizeModel = require('sequelize').Model;
const Link = require('./link');

class Resource {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.links = [];
  }

  addLink(name, href) {
    this.links.push(new Link(name, href));
  }

  buildLinksArray(object) {
    return this.links.reduce((acc, link) => {
      // autogenera si el nombre del enlace se encuentra en el array enviado
      return object._links.indexOf(link.name) > -1
        ? Object.assign({}, acc, link.ref(object))
        // caso contrario no agrega nada
        : acc;
    }, {});
  }

  buildLinksObject(object) {
    return this.links.reduce((acc, link) => {
      // es un objeto y tiene una clave con el enlace que se quiere generar
      if (link.name in object._links) {
        // si el valor fuera boolean
        if (typeof object._links[link.name] === 'boolean') {
          // autogenera el enlace si es true, caso contrario no agrega nada
          return object._links[link.name] ? Object.assign({}, acc, link.ref(object)) : acc;
        }
        // caso contrario es string y copia el texto tal cual
        return Object.assign({}, acc, link.refString(object._links[link.name]));
      }
      // si el array o el objeto estuviera vacios, no agrega nada
      return acc;
    }, {});
  }

  buildLinksDefault(object) {
    return this.links.reduce((acc, link) => {
      return Object.assign({}, acc, link.ref(object));
    }, {});
  }

  buildLinks(object) {
    if ('_links' in object) {
      if (Array.isArray(object._links)) {
        return this.buildLinksArray(object);
      }
      return this.buildLinksObject(object);
    }
    return this.buildLinksDefault(object);
  }

  transform(object) {
    // si es instancia de un modelo de Sequelize cambia
    const plainObject = object instanceof SequelizeModel ? object.dataValues : object;

    return Object.assign({}, plainObject, {
      _links: this.buildLinks(plainObject),
    });
  }
}

module.exports = Resource;
