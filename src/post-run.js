'use strict';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs');
const access = promisify(fs.access);

async function postRun({
  cwd,
}) {
  let exists;
  try {
    await access(`${cwd}/yarn.lock`, fs.constants.F_OK);
    exists = true;
  } catch (err) {}

  if (exists) {
    await exec('yarn', { cwd });
  }
}

module.exports = postRun;
