'use strict';

const execa = require('execa');
const fs = { ...require('fs'), ...require('fs').promises };

async function postRun({
  cwd = process.cwd(),
} = {}) {
  let exists;
  try {
    await fs.access(`${cwd}/yarn.lock`, fs.constants.F_OK);
    exists = true;
  } catch (err) {}

  if (exists) {
    await execa('yarn', { cwd });
  }
}

module.exports = postRun;
