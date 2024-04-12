'use strict';

const fs = { ...require('fs'), ...require('fs').promises };
const { EOL } = require('os');
const { dirname } = require('path');

async function replaceFile(path, callback) {
  let oldContents = await fs.readFile(path, 'utf8');

  let newContents = await callback(oldContents);

  await fs.writeFile(path, newContents);

  return newContents;
}

async function replaceJsonFile(path, callback) {
  return await replaceFile(path, async oldContents => {
    let oldJson = JSON.parse(oldContents);

    let newJson = await callback(oldJson);

    if (!newJson) {
      // mutation
      newJson = oldJson;
    }

    let newContents = JSON.stringify(newJson, null, 2) + EOL;

    return newContents;
  });
}

/**
 * @param {string} path
 */
async function safeReadFile(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }

    return null;
  }
}

/**
 * @param {string} path
 */
async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

/**
 * @param {string} path
 * @param {string} data
 */
async function ensureWriteFile(path, data) {
  await ensureDir(dirname(path));

  await fs.writeFile(path, data);
}

module.exports = {
  replaceFile,
  replaceJsonFile,
  safeReadFile,
  ensureDir,
  ensureWriteFile,
};
