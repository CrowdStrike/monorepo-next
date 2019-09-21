'use strict';

const { EOL } = require('os');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);

function stringify(json) {
  return JSON.stringify(json, null, 2).replace(/\n/g, EOL) + EOL;
}

async function read(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function write(path, json) {
  await writeFile(path, stringify(json));
}

module.exports = {
  stringify,
  read,
  write,
};
