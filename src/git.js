'use strict';

const execa = require('execa');

async function git(args, {
  cwd,
}) {
  let { stdout } = await execa('git', args, {
    cwd,
  });

  return stdout;
}

async function getCurrentBranch(cwd) {
  return await git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
}

async function getCommitAtTag(tag, cwd) {
  return await git(['rev-list', '-1', tag], { cwd });
}

async function getFirstCommit(cwd) {
  // https://stackoverflow.com/a/5189296
  let rootCommits = await git(['rev-list', '--max-parents=0', 'HEAD'], { cwd });
  return getLinesFromOutput(rootCommits)[0];
}

async function getWorkspaceCwd(cwd) {
  return await git(['rev-parse', '--show-toplevel'], { cwd });
}

function getLinesFromOutput(output) {
  return output.split(/\r?\n/).filter(Boolean);
}

async function isCommitAncestorOf(ancestorCommit, descendantCommit, cwd) {
  try {
    await git(['merge-base', '--is-ancestor', ancestorCommit, descendantCommit], { cwd });
  } catch (err) {
    if (err.exitCode !== 1) {
      throw err;
    }
    return false;
  }
  return true;
}

async function getCommonAncestor(commit1, commit2, cwd) {
  return await git(['merge-base', commit1, commit2], { cwd });
}

async function getCommitSinceLastRelease(_package) {
  let { version } = _package;

  let matches = version.match(/(.*)-detached.*/);

  if (matches) {
    version = matches[1];
  }

  let tag = `${_package.packageName}@${version}`;

  try {
    return await getCommitAtTag(tag, _package.cwd);
  } catch (err) {
    if (err.stderr.includes(`fatal: ambiguous argument '${tag}': unknown revision or path not in the working tree.`)) {
      return await getFirstCommit(_package.cwd);
    } else {
      throw err;
    }
  }
}

module.exports = {
  git,
  getCurrentBranch,
  getWorkspaceCwd,
  getLinesFromOutput,
  isCommitAncestorOf,
  getCommonAncestor,
  getCommitSinceLastRelease,
};
