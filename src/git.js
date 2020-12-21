'use strict';

const execa = require('execa');

let cache = {};

function getCacheKey(args, cwd) {
  return [cwd, ...args].join();
}

async function git(args, {
  cwd,
  cached,
}) {
  let cacheKey = getCacheKey(args, cwd);

  if (cached && cacheKey in cache) {
    return cache[cacheKey];
  }

  let { stdout } = await execa('git', args, {
    cwd,
  });

  if (cached) {
    cache[cacheKey] = stdout;
  }

  return stdout;
}

async function getCurrentBranch(cwd) {
  return await git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
}

async function getCommitAtTag(tag, options) {
  return await git(['rev-list', '-1', tag], options);
}

async function getFirstCommit(options) {
  // https://stackoverflow.com/a/5189296
  let rootCommits = await git(['rev-list', '--max-parents=0', 'HEAD'], options);
  return getLinesFromOutput(rootCommits)[0];
}

async function getWorkspaceCwd(cwd) {
  return await git(['rev-parse', '--show-toplevel'], { cwd });
}

function getLinesFromOutput(output) {
  return output.split(/\r?\n/).filter(Boolean);
}

async function isCommitAncestorOf(ancestorCommit, descendantCommit, options) {
  try {
    await git(['merge-base', '--is-ancestor', ancestorCommit, descendantCommit], options);
  } catch (err) {
    if (err.exitCode !== 1) {
      throw err;
    }
    return false;
  }
  return true;
}

async function getCommonAncestor(commit1, commit2, options) {
  return await git(['merge-base', commit1, commit2], options);
}

async function getCommitSinceLastRelease(_package, options) {
  let { version } = _package;

  let matches = version.match(/(.*)-detached.*/);

  if (matches) {
    version = matches[1];
  }

  let tag = `${_package.packageName}@${version}`;

  try {
    return await getCommitAtTag(tag, options);
  } catch (err) {
    if (err.stderr.includes(`fatal: ambiguous argument '${tag}': unknown revision or path not in the working tree.`)) {
      return await getFirstCommit(options);
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
