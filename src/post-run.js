'use strict';

const { promisify } = require('util');
const execa = require('execa');
const fs = require('fs');
const access = promisify(fs.access);

async function postRun({
  cwd = process.cwd(),
} = {}) {
  let exists;
  try {
    await access(`${cwd}/yarn.lock`, fs.constants.F_OK);
    exists = true;
  } catch (err) {}

  if (exists) {
    await execa('yarn', { cwd });
  }
}

module.exports = postRun;
