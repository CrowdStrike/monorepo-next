'use strict';


async function getLastCommitMessage(cwd) {
  return (await (await import('execa')).execa('git', ['log', '-1', '--pretty=%B'], { cwd })).stdout.trim();
}

async function getTagsOnLastCommit(cwd) {
  return (await (await import('execa')).execa('git', ['tag', '-l', '--points-at', 'HEAD'], { cwd })).stdout.split(/\r?\n/).filter(Boolean);
}

async function doesTagExist(ref, cwd) {
  try {
    await (await import('execa')).execa('git', ['rev-parse', ref], { cwd });
  } catch (err) {
    if (err.stderr.includes('unknown revision or path not in the working tree')) {
      return false;
    }

    throw err;
  }

  return true;
}

async function isGitClean(cwd) {
  let { stdout } = await (await import('execa')).execa('git', ['status', '--porcelain'], { cwd });

  return !stdout;
}

module.exports = {
  ...require('../../src/git'),
  getLastCommitMessage,
  getTagsOnLastCommit,
  doesTagExist,
  isGitClean,
};
