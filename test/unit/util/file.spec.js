const { expect } = require('chai');
const rewiremock = require('rewiremock').default;

rewiremock('fs').with({
  readdirSync(dir) {
    if (dir === 'dir1') {
      return ['dir11', 'file1.js', 'file2.js', 'ignore.js'];
    }
    if (dir === 'dir1/dir11') {
      return ['file11.js', 'file12.js'];
    }
    return [];
  },
  statSync(path) {
    return {
      isDirectory() {
        return path.substring(path.lastIndexOf('/') + 1).substring(0, 3) === 'dir';
      },
    };
  },
});

rewiremock('path').with({
  join(...args) {
    return args.join('/');
  },
});

let fileUtil;

describe('Unit Testing file Util module', () => {
  before(() => {
    rewiremock.enable();
    fileUtil = require('../../../util/file');
  });

  after(() => { rewiremock.disable(); });

  describe('normalizeName', () => {
    it('should not change a single word', () => {
      expect(fileUtil.normalizeName('name')).to.be.equal('name');
    });

    it('should capitalize a word with dashes', () => {
      expect(fileUtil.normalizeName('name-other')).to.be.equal('nameOther');
    });

    it('should capitalize a word with a lot of dashes', () => {
      expect(fileUtil.normalizeName('name-other-extra-more')).to.be.equal('nameOtherExtraMore');
    });

    it('should capitalize a word with lower dashes', () => {
      expect(fileUtil.normalizeName('name_other')).to.be.equal('nameOther');
    });

    it('should capitalize a word with a lot of lower dashes', () => {
      expect(fileUtil.normalizeName('name_other_extra_more')).to.be.equal('nameOtherExtraMore');
    });

    it('should capitalize a word with a lot of normal and lower dashes combined', () => {
      expect(fileUtil.normalizeName('na_off-one_two-three')).to.be.equal('naOffOneTwoThree');
    });
  });

  describe('loaddirSync', () => {
    it('should load all files in all folders', (done) => {
      const filePathList = fileUtil.loaddirSync('dir1', '.js', []);
      expect(filePathList).to.have.length(5);
      expect(filePathList).to.deep.include({ file: 'file1.js', path: 'dir1/file1.js' });
      expect(filePathList).to.deep.include({ file: 'file2.js', path: 'dir1/file2.js' });
      expect(filePathList).to.deep.include({ file: 'ignore.js', path: 'dir1/ignore.js' });
      expect(filePathList).to.deep.include({ file: 'file11.js', path: 'dir1/dir11/file11.js' });
      expect(filePathList).to.deep.include({ file: 'file12.js', path: 'dir1/dir11/file12.js' });
      done();
    });

    it('should load all files that end with `1.js` in all folders', (done) => {
      const filePathList = fileUtil.loaddirSync('dir1', '1.js', []);
      expect(filePathList).to.have.length(2);
      expect(filePathList).to.deep.include({ file: 'file1.js', path: 'dir1/file1.js' });
      expect(filePathList).to.deep.include({ file: 'file11.js', path: 'dir1/dir11/file11.js' });
      done();
    });

    it('should load all files in all folders but ignore ignore.js', (done) => {
      const filePathList = fileUtil.loaddirSync('dir1', '.js', ['ignore.js']);
      expect(filePathList).to.have.length(4);
      expect(filePathList).to.deep.include({ file: 'file1.js', path: 'dir1/file1.js' });
      expect(filePathList).to.deep.include({ file: 'file2.js', path: 'dir1/file2.js' });
      expect(filePathList).to.deep.include({ file: 'file11.js', path: 'dir1/dir11/file11.js' });
      expect(filePathList).to.deep.include({ file: 'file12.js', path: 'dir1/dir11/file12.js' });
      done();
    });
  });
});
