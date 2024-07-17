'use strict';

const {
  git,
  getLinesFromOutput,
} = require('../../src/git');

async function getLastCommitMessage(cwd) {
  return (await git(['log', '-1', '--pretty=%B'], { cwd })).trim();
}

async function getTagsOnLastCommit(cwd) {
  return getLinesFromOutput(await git(['tag', '-l', '--points-at', 'HEAD'], { cwd }));
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
  getTagsOnLastCommit,
  doesTagExist,
  isGitClean,
};
