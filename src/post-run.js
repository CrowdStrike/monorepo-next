'use strict';

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
    await (await import('execa')).execa('yarn', { cwd });
  }
}

module.exports = postRun;
