const Resource = require('./resource');

class Collection extends Resource {
  constructor(endpoint, resourceEntity) {
    super(endpoint);
    this.resourceEntity = resourceEntity;
  }

  transform(object) {
    return {
      count: object.count,
      rows: object.rows.map((row) => {
        return this.resourceEntity.transform(row);
      }),
      _links: this.buildLinks(object),
    };
  }
}

module.exports = Collection;
