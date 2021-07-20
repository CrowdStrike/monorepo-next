'use strict';

const { EOL } = require('os');
const fs = { ...require('fs'), ...require('fs').promises };

function stringify(json) {
  return JSON.stringify(json, null, 2).replace(/\n/g, EOL) + EOL;
}

async function read(path) {
  return JSON.parse(await fs.readFile(path, 'utf8'));
}

async function write(path, json) {
  await fs.writeFile(path, stringify(json));
}

module.exports = {
  stringify,
  read,
  write,
};
