'use strict';

const execa = require('execa');

async function getLastCommitMessage(cwd) {
  return (await execa('git', ['log', '-1', '--pretty=%B'], { cwd })).stdout.trim();
}

async function getTagsOnLastCommit(cwd) {
  return (await execa('git', ['tag', '-l', '--points-at', 'HEAD'], { cwd })).stdout.split(/\r?\n/).filter(Boolean);
}

async function getCurrentCommit(cwd) {
  return (await execa('git', ['rev-parse', 'HEAD'], { cwd })).stdout;
}

module.exports = {
  getLastCommitMessage,
  getTagsOnLastCommit,
  getCurrentCommit,
};
