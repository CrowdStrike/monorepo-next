'use strict';

const execa = require('execa');
const debug = require('./debug').extend('git');
const sanitize = require('sanitize-filename');
const path = require('path');
const { safeReadFile, ensureDir, ensureWriteFile } = require('./fs');
const { promisify } = require('util');
const lockfile = require('lockfile');
const lock = promisify(lockfile.lock);
const unlock = promisify(lockfile.unlock);

let cache = {};

function getCacheKey(args, cwd) {
  return sanitize([cwd, ...args].join());
}

async function git(args, options) {
  let {
    cwd,
    cached,
    shouldUseExitCode,
  } = options;

  /**
   * Git is inverted. A zero exit code is true.
   * @param {number} exitCode
   */
  function toBool(exitCode) {
    return exitCode === 0;
  }

  let cacheKey;
  let lockFilePath;

  if (cached) {
    cacheKey = getCacheKey(args, cwd);

    if (cacheKey in cache) {
      debug('Git cache hit.');

      return cache[cacheKey];
    }

    if (cached !== true) {
      lockFilePath = path.join(cached, `${cacheKey}.lock`);

      await ensureDir(cached);

      debug(`Waiting for git lock at ${lockFilePath}.`);

      await lock(lockFilePath, { wait: 10 * 60e3 });

      debug(`Acquired git lock at ${lockFilePath}.`);
    }
  }

  try {
    let cachedFilePath;

    if (cached) {
      if (cached !== true) {
        cachedFilePath = path.join(cached, cacheKey);

        let _cache = await safeReadFile(cachedFilePath);

        if (_cache !== null) {
          debug('Git cache hit.');

          let normalized = (() => {
            if (shouldUseExitCode) {
              return _cache === 'true';
            }

            return _cache;
          })();

          cache[cacheKey] = normalized;

          return normalized;
        }
      }

      debug('Git cache miss.');
    }

    debug(args, options);

    let {
      stdout,
      all,
      exitCode,
    } = await execa('git', args, {
      cwd,
      reject: !shouldUseExitCode,
    });

    debug(all);

    let result = (() => {
      if (shouldUseExitCode) {
        return toBool(exitCode);
      }

      return stdout;
    })();

    if (cached) {
      cache[cacheKey] = result;

      if (cached !== true) {
        await ensureWriteFile(cachedFilePath, result.toString());
      }
    }

    return result;
  } finally {
    if (lockFilePath) {
      await unlock(lockFilePath);

      debug(`Released git lock at ${lockFilePath}.`);
    }
  }
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
  return await git(['merge-base', '--is-ancestor', ancestorCommit, descendantCommit], {
    shouldUseExitCode: true,
    ...options,
  });
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
    if (err.stderr?.includes(`fatal: ambiguous argument '${tag}': unknown revision or path not in the working tree.`)) {
      return await getFirstCommit(options);
    } else {
      throw err;
    }
  }
}

async function getFileAtCommit(filePath, commit, cwd) {
  return await git(['show', `${commit}:${filePath}`], { cwd });
}

async function getCurrentCommit(cwd) {
  return await git(['rev-parse', 'HEAD'], { cwd });
}

module.exports = {
  getCacheKey,
  git,
  getCurrentBranch,
  getWorkspaceCwd,
  getLinesFromOutput,
  isCommitAncestorOf,
  getCommonAncestor,
  getCommitSinceLastRelease,
  getFileAtCommit,
  getCurrentCommit,
};
