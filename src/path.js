'use strict';

const path = require('path');

function isSubDir(dir, subDir) {
  let relative = path.relative(dir, subDir);

  return !relative.startsWith(`..${path.sep}`);
}

module.exports = {
  isSubDir,
};
