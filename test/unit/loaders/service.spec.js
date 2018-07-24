const path = require('path');
const { expect } = require('chai');

const serviceLoader = require('../../../loaders/service');

describe('service Loader', () => {
  describe('load a services folder', () => {
    const servicePath = path.resolve(__dirname, './srcSample');

    it('should load a services folder with default options', (done) => {
      const services = serviceLoader({ appPath: servicePath }, {});
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services.book).to.be.an('object');
      expect(services.author).to.be.an('object');
      expect(services.book.list).to.be.an('function');
      expect(services.author.list).to.be.an('function');
      done();
    });

    it('should load a services folder with suffix in their name', (done) => {
      const services = serviceLoader({
        appPath: servicePath,
        service: {
          dir: 'servicesSuffix',
          suffix: '.ser',
        },
      }, {});
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services.book).to.be.an('object');
      expect(services.author).to.be.an('object');
      done();
    });

    it('should load a services folder with some to be ignored', (done) => {
      const services = serviceLoader({
        appPath: servicePath,
        service: {
          dir: 'servicesIgnore',
          ignore: ['author2.service.js'],
        },
      }, {});
      expect(services).to.be.an('object');
      expect(services).to.have.property('book');
      expect(services).to.have.property('author');
      expect(services).to.not.have.property('author2');
      expect(services.book).to.be.an('object');
      expect(services.author).to.be.an('object');
      done();
    });
  });
});
