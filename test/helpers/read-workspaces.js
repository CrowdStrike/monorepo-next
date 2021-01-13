'use strict';

const fixturify = require('fixturify');

function readWorkspaces(tmpPath) {
  return fixturify.readSync(tmpPath, {
    ignore: [
      '.git',
      '**/CHANGELOG.md',
    ],
  });
}

module.exports = readWorkspaces;
