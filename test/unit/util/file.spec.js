const path = require('path');
const fs = require('fs');
const { expect } = require('chai');

const fileUtil = require('../../../util/file');

describe('file Util module', () => {
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
      expect(fileUtil.normalizeName('name_other-one_extra-more')).to.be.equal('nameOtherOneExtraMore');
    });
  });

  describe('loaddirSync', () => {
    const sampleFolder = path.resolve(__dirname, './loaddirSyncSample');

    it('should load all files in all folders', (done) => {
      const filePathList = [];
      fileUtil.loaddirSync(sampleFolder, '.js', [], (err, file, filePath) => {
        // to make sure it is a file
        const stat = fs.statSync(filePath);
        expect(stat).to.not.be.undefined;
        filePathList.push(filePath);
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
      const filePathList = [];
      fileUtil.loaddirSync(sampleFolder, '.unit.js', [], (err, file, filePath) => {
        const stat = fs.statSync(filePath);
        expect(stat).to.not.be.undefined;
        filePathList.push(filePath);
      });
      expect(filePathList).to.have.length(3);
      expect(filePathList).to.include(`${sampleFolder}/fileA.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder1/folder1_1/file1.unit.js`);
      expect(filePathList).to.include(`${sampleFolder}/folder2/folder2_1/file1.unit.js`);
      done();
    });

    it('should load all files in all folders but ignore fileA.unit.js', (done) => {
      const filePathList = [];
      fileUtil.loaddirSync(sampleFolder, '.js', ['file1.unit.js'], (err, file, filePath) => {
        const stat = fs.statSync(filePath);
        expect(stat).to.not.be.undefined;
        filePathList.push(filePath);
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
