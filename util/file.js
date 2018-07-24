const fs = require('fs');
const path = require('path');

/**
 * Recursive synchronous folder reading
 */
const loaddirSync = (dir, suffix, ignore, callbackParam) => {
  const callback = callbackParam || ignore;

  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      loaddirSync(filePath, suffix, ignore, callbackParam);
    } else if (
      (file.indexOf('.') !== 0)
      && (callbackParam ? ignore.indexOf(file) < 0 : true)
      && (file.slice(-suffix.length) === suffix)
    ) {
      callback(null, file, filePath);
    }
  });
};

const readdirPromise = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
};

const isDirectoryPromise = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) reject(err);
      else resolve(stats.isDirectory());
    });
  });
};

/**
 * Recursive asynchronous folder reading
 * @return {Promise} Resolvable promise when all files are finished reading
 */
const loaddir = (dir, suffix, ignore, callbackParam) => {
  const callback = callbackParam || ignore;

  return readdirPromise(dir)
  .then((files) => {
    return Promise.all(files.map((file) => {
      const filePath = path.join(dir, file);

      return isDirectoryPromise(filePath)
      .then((isDirectory) => {
        if (isDirectory) {
          return loaddir(filePath, suffix, ignore, callbackParam);
        } else if (
          (file.indexOf('.') !== 0)
          && (callbackParam ? ignore.indexOf(file) < 0 : true)
          && (file.slice(-suffix.length) === suffix)
        ) {
          return callback(null, file, filePath);
        }
        return false;
      });
    }));
  });
};

const normalizeName = (name) => {
  return name.split(/-|_/).reduce((acc, val) => {
    if (!acc) return val;
    return `${acc}${val.charAt(0).toUpperCase()}${val.slice(1)}`;
  }, '');
};

module.exports = {
  loaddir,
  loaddirSync,
  normalizeName,
};
