const file = require('../../../util/file');
const { expect } = require('chai');

describe('File Util module', () => {
  describe('normalizeName', () => {
    it('should not change a single word', () => {
      expect(file.normalizeName('name')).to.be.equal('name');
    });

    it('should capitalize a word with dashes', () => {
      expect(file.normalizeName('name-other')).to.be.equal('nameOther');
    });

    it('should capitalize a word with a lot of dashes', () => {
      expect(file.normalizeName('name-other-extra-more')).to.be.equal('nameOtherExtraMore');
    });

    it('should capitalize a word with lower dashes', () => {
      expect(file.normalizeName('name_other')).to.be.equal('nameOther');
    });

    it('should capitalize a word with a lot of lower dashes', () => {
      expect(file.normalizeName('name_other_extra_more')).to.be.equal('nameOtherExtraMore');
    });

    it('should capitalize a word with a lot of normal and lower dashes combined', () => {
      expect(file.normalizeName('name_other-one_extra-more')).to.be.equal('nameOtherOneExtraMore');
    });
  });
});
