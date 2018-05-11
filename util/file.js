const fs = require('fs');
const path = require('path');

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
