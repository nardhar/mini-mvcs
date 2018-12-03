const fs = require('fs');
const path = require('path');

/**
 * Loads all files within a dir, returning a list of objects with the filename and its path
 * @param {String} dir Directory path
 * @param {String} suffix Suffix of the files to be loaded
 * @param {Array<String>} ignore Files to be ignored
 * @return {Array<Object>} List of files with its name and path
 */
const loaddirSync = (dir, suffix, ignore = []) => {
  // checking if the folder exists and if it can be read
  try {
    fs.accessSync(dir, fs.constants.R_OK);
  } catch (error) {
    return [];
  }
  return fs.readdirSync(dir).reduce((fileList, file) => {
    // it builds the file's full path
    const filePath = path.join(dir, file);
    // asking if it is not a directory to try to import it
    if (!fs.statSync(filePath).isDirectory()) {
      // asking if it is an loadable file
      if (
        // does not import files starting with .
        (file.indexOf('.') !== 0)
        // does not import ignored files
        && (ignore.indexOf(file) < 0)
        // only imports files that ends with the suffix
        && (file.slice(-suffix.length) === suffix)
      ) {
        // adds the file info to the current fileList array
        return fileList.concat({ file, path: filePath });
      }
      // if it is not a loadable file, then returns the same fileList without adding anything
      return fileList;
    }
    // if it is a directory then it runs the same function over this directory
    return fileList.concat(loaddirSync(filePath, suffix, ignore));
  }, []);
};

const normalizeName = (name) => {
  return name.split(/-|_/).reduce((acc, val) => {
    if (!acc) return val;
    return `${acc}${val.charAt(0).toUpperCase()}${val.slice(1)}`;
  }, '');
};

module.exports = {
  loaddirSync,
  normalizeName,
};
