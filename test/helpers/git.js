'use strict';

const execa = require('execa');

async function getLastCommitMessage(cwd) {
  return (await execa('git', ['log', '-1', '--pretty=%B'], { cwd })).stdout.trim();
}

async function getTagsOnLastCommit(cwd) {
  return (await execa('git', ['tag', '-l', '--points-at', 'HEAD'], { cwd })).stdout.split(/\r?\n/).filter(Boolean);
}

async function doesTagExist(ref, cwd) {
  try {
    await execa('git', ['rev-parse', ref], { cwd });
  } catch (err) {
    if (err.stderr.includes('unknown revision or path not in the working tree')) {
      return false;
    }

    throw err;
  }

  return true;
}

async function isGitClean(cwd) {
  let { stdout } = await execa('git', ['status', '--porcelain'], { cwd });

  return !stdout;
}

module.exports = {
  ...require('../../src/git'),
  getLastCommitMessage,
  getTagsOnLastCommit,
  doesTagExist,
  isGitClean,
};
