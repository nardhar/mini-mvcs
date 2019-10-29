const { expect } = require('chai');
// NOTE: sequelize-mock is not working right, or at least it does not emulates a database state
// maybe a custom sequelize mock should be created or convert all these tests into integration ones
const crudService = require('../../../src/crud/crud-service');

class BookModelMock {
  set(params) {
    this.title = params.title;
  }

  validate() {
    return Promise.resolve(this);
  }

  save() {
    this.id = 1;
    return Promise.resolve(this);
  }

  destroy() {
    this.id = null;
    return Promise.resolve();
  }
}

BookModelMock.build = (params) => {
  const instance = new BookModelMock();
  instance.set(params);
  return instance;
};
BookModelMock.associations = {};
BookModelMock.primaryKeys = { id: 'id' };
BookModelMock.name = 'Book';

const bookMockRecord = BookModelMock.build({ title: 'Birds and Planes' });

BookModelMock.findOne = () => {
  return Promise.resolve(bookMockRecord);
};
BookModelMock.findAll = () => {
  return Promise.resolve([bookMockRecord]);
};
BookModelMock.findAndCountAll = () => {
  return Promise.resolve({ rows: [bookMockRecord], count: 1 });
};

const AuthorFilterMock = {
  name: 'Author',
  associations: {},
};
const CategoryFilterMock = {
  name: 'Category',
  associations: {},
};
const BookFilterMock = {
  name: 'Book',
  associations: {
    author: {
      target: AuthorFilterMock,
      as: 'author',
    },
    category: {
      target: CategoryFilterMock,
      as: 'category',
    },
  },
};

AuthorFilterMock.associations = {
  books: {
    target: BookFilterMock,
    as: 'books',
  },
};
CategoryFilterMock.associations = {
  books: {
    target: BookFilterMock,
    as: 'books',
  },
};

describe('Unit Testing CRUD Service', () => {
  describe('Creating a CRUD service', () => {
    it('should have default methods', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('list');
      expect(bookCrudService).to.have.property('listAndCount');
      expect(bookCrudService).to.have.property('read');
      expect(bookCrudService).to.have.property('filter');
      expect(bookCrudService).to.have.property('offsetLimit');
      expect(bookCrudService).to.have.property('find');
      expect(bookCrudService).to.have.property('create');
      expect(bookCrudService).to.have.property('save');
      expect(bookCrudService).to.have.property('edit');
      expect(bookCrudService).to.have.property('update');
      expect(bookCrudService).to.have.property('validate');
      expect(bookCrudService).to.have.property('delete');
      done();
    });
  });

  describe('Filter method', () => {
    it('should return a simple object with conditions', (done) => {
      const bookCrudService = crudService(BookFilterMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('filter');
      expect(bookCrudService.filter({ title: 'Reading Better' })).to.deep.equal({
        where: {
          title: 'Reading Better',
        },
      });
      done();
    });

    it('should return a complex object with conditions', (done) => {
      const bookCrudService = crudService(BookFilterMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('filter');
      expect(bookCrudService.filter({
        title: 'Reading Better',
        author: {
          name: 'John',
        },
        limit: 10,
        offset: 5,
        order: [['name']],
      })).to.deep.equal({
        where: {
          title: 'Reading Better',
        },
        include: [
          {
            model: AuthorFilterMock,
            as: 'author',
            where: {
              name: 'John',
            },
          },
        ],
        limit: 10,
        offset: 5,
        order: [['name']],
      });
      done();
    });

    it('should return a multiple associated object with conditions', (done) => {
      const authorCrudService = crudService(AuthorFilterMock);

      expect(authorCrudService).to.be.an('object');
      expect(authorCrudService).to.have.property('filter');
      expect(authorCrudService.filter({
        name: 'John Smith',
        books: {
          title: 'Programming with NodeJS',
          category: {
            name: 'software development',
          },
        },
        limit: 10,
        offset: 5,
      })).to.deep.equal({
        where: {
          name: 'John Smith',
        },
        include: [
          {
            model: BookFilterMock,
            as: 'books',
            where: {
              title: 'Programming with NodeJS',
            },
            include: [
              {
                model: CategoryFilterMock,
                as: 'category',
                where: {
                  name: 'software development',
                },
              },
            ],
          },
        ],
        limit: 10,
        offset: 5,
      });
      done();
    });
  });

  describe('Listing models', () => {
    it('should list models', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('list');
      bookCrudService.list().then((bookList) => {
        expect(bookList).to.be.an('array');
        expect(bookList).to.have.length(1);
        done();
      });
    });

    it('should list models with a query', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('list');
      bookCrudService.list({ id: 1 }).then((bookList) => {
        expect(bookList).to.be.an('array');
        expect(bookList).to.have.length(1);
        done();
      });
    });

    it('should list and count all models', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('listAndCount');
      bookCrudService.listAndCount().then((bookListCount) => {
        expect(bookListCount).to.be.an('object');
        expect(bookListCount).to.have.property('count', 1);
        expect(bookListCount).to.have.property('rows');
        expect(bookListCount.rows).to.be.an('array');
        done();
      });
    });
  });

  describe('Reading models', () => {
    it('should read a model through an id', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('read');
      bookCrudService.read(1).then((book) => {
        expect(book).to.be.an('object');
        expect(book).to.have.property('title', 'Birds and Planes');
        done();
      });
    });

    it('should find a model through a query', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('read');
      bookCrudService.find({ id: 1 }).then((book) => {
        expect(book).to.be.an('object');
        expect(book).to.have.property('title', 'Birds and Planes');
        done();
      });
    });
  });

  describe('Creating models', () => {
    it('should create a model', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('create');
      const book = bookCrudService.create({ title: 'the crow' });
      expect(book).to.be.an('object');
      expect(book).to.have.property('title', 'the crow');
      done();
    });
  });

  describe('saving models', () => {
    it('should save a model', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('save');
      bookCrudService.save({ title: 'the crow' }).then((book) => {
        expect(book).to.be.an('object');
        expect(book).to.have.property('title', 'the crow');
        done();
      });
    });
  });

  describe('editing models', () => {
    it('should edit a model', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('edit');
      bookCrudService.edit(1, { title: 'the crow' }).then((book) => {
        expect(book).to.be.an('object');
        expect(book).to.have.property('title', 'the crow');
        done();
      });
    });
  });

  describe('updating models', () => {
    it('should update a model', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('update');
      bookCrudService.update(1, { title: 'the crow' }).then((book) => {
        expect(book).to.be.an('object');
        expect(book).to.have.property('title', 'the crow');
        done();
        // bookCrudService.read(1).then((book2) => {
        //   expect(book2).to.be.an('object');
        //   expect(book2).to.have.property('title', 'the crow');
        //   done();
        // });
      });
    });
  });

  describe('deleting models', () => {
    it('should update a model', (done) => {
      const bookCrudService = crudService(BookModelMock);

      expect(bookCrudService).to.be.an('object');
      expect(bookCrudService).to.have.property('delete');
      bookCrudService.delete(1).then(done);
    });
  });
});
