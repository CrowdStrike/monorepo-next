'use strict';

const fs = { ...require('fs'), ...require('fs').promises };
const { EOL } = require('os');

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

module.exports = {
  replaceFile,
  replaceJsonFile,
};
