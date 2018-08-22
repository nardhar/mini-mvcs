const { expect } = require('chai');
const path = require('path');
// const proxyQuire = require('proxyquire-2');
// const fs = require('fs');

// const fileUtil = proxyQuire('../../../util/file', { fs, path });

const fileUtil = require('../../../util/file');

describe('Integration Testing file Util module', () => {
  describe('loaddirSync', () => {
    const sampleFolder = path.resolve(__dirname, './loaddirSyncSample');

    it('should load all files in all folders', (done) => {
      const filePathList = fileUtil.loaddirSync(sampleFolder, '.js', []).map((fileObject) => {
        return fileObject.path;
      });
      expect(filePathList).to.have.length(10);
      expect(filePathList).to.include(`${sampleFolder}/fileA.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/fileB.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/file1.service.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/file2.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/folder1_1/file1.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/folder1_1/file2.new.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/file1.service.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/file2.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/folder2_1/file1.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/folder2_1/file2.js`);
      done();
    });

    it('should load all .unit files in all folders', (done) => {
      const filePathList = fileUtil.loaddirSync(sampleFolder, '.unit.js', []).map((fileObject) => {
        return fileObject.path;
      });
      expect(filePathList).to.have.length(3);
      expect(filePathList).to.include(`${sampleFolder}/fileA.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/folder1_1/file1.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/folder2_1/file1.unit.js`);
      done();
    });

    it('should load all files in all folders but ignore fileA.unit.js', (done) => {
      const filePathList = fileUtil.loaddirSync(
        sampleFolder,
        '.js',
        ['file1.unit.js'],
      ).map((fileObject) => {
        return fileObject.path;
      });
      expect(filePathList).to.have.length(8);
      expect(filePathList).to.include(`${sampleFolder}/fileA.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/fileB.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/file1.service.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/file2.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/folder1_1/file2.new.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/file1.service.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/file2.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/folder2_1/file2.js`);
      done();
    });
  });
});
