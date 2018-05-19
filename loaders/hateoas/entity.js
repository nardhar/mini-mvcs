const Resource = require('./resource');

class Entity extends Resource {
  constructor(endpoint) {
    super(endpoint);
  }
}

module.exports = Entity;
