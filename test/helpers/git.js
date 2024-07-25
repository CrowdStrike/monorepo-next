'use strict';

const {
  git,
} = require('../../src/git');

async function getLastCommitMessage(cwd) {
  return (await git(['log', '-1', '--pretty=%B'], { cwd })).trim();
}

async function doesTagExist(ref, cwd) {
  try {
    await git(['rev-parse', ref], { cwd });
  } catch (err) {
    if (err.stderr.includes('unknown revision or path not in the working tree')) {
      return false;
    }

    throw err;
  }

  return true;
}

async function isGitClean(cwd) {
  let stdout = await git(['status', '--porcelain'], { cwd });

  return !stdout;
}

module.exports = {
  ...require('../../src/git'),
  getLastCommitMessage,
  doesTagExist,
  isGitClean,
};
