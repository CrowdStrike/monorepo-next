'use strict';

const packlist = require('npm-packlist');
const path = require('path');
const { createTmpDir } = require('./tmp');
const fs = require('fs');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const {
  union,
  intersection,
  map,
} = require('./set');
const { createPatch } = require('rfc6902');
const {
  getFileAtCommit,
} = require('./git');

const filesContributingToReleasability = new Set([
  '.gitignore',
  '.npmignore',
  'package.json',
]);

const packageJsonDevChangeRegex = /^\/(?:devDependencies|publishConfig)(?:\/|$)/m;

async function prepareTmpPackage({
  cwd,
  tmpDir,
  changedFiles,
}) {
  for (let fileName of filesContributingToReleasability) {
    let from = path.join(cwd, fileName);
    let to = path.join(tmpDir, fileName);

    await mkdir(path.dirname(to), { recursive: true });

    try {
      await copyFile(from, to);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  for (let file of changedFiles) {
    if (filesContributingToReleasability.has(file)) {
      continue;
    }

    let filePath = path.join(tmpDir, file);

    await mkdir(path.dirname(filePath), { recursive: true });

    await writeFile(filePath, '');
  }
}

// We need to check the changed files rather than
// what is on disk. A published file could be removed,
// but it wouldn't look like a new version is needed
// because it's no longer on disk.
async function _getChangedReleasableFiles({
  cwd,
  changedFiles,
}) {
  let tmpDir = await createTmpDir();

  // This is all because `npm-packlist`/`ignore-walk`
  // doesn't accept a list of files instead of walking.
  await prepareTmpPackage({
    cwd,
    tmpDir,
    changedFiles,
  });

  let changedPublishedFiles = await packlist({ path: tmpDir });

  let changedPublishedFilesOld = new Set(changedPublishedFiles);

  let changedPublishedFilesNew = new Set();

  for (let file of changedFiles) {
    if (changedPublishedFilesOld.has(file)) {
      changedPublishedFilesNew.add(file);
    }

    // these files may not show up in the bundle, but
    // contribute to what goes in the bundle, so we must preserve
    // the changed status to know if the package is invalidated or not
    if (filesContributingToReleasability.has(file)) {
      changedPublishedFilesNew.add(file);
    }
  }

  changedPublishedFilesNew = intersection(
    union(
      changedPublishedFilesOld,
      filesContributingToReleasability,
    ),
    changedFiles,
  );

  return changedPublishedFilesNew;
}

async function isPackageJsonChangeReleasable({
  relativePackageJsonPath,
  tagCommit,
  workspacesCwd,
}) {
  let newPackageJson = JSON.parse(await readFile(path.join(workspacesCwd, relativePackageJsonPath)));

  let oldPackageJson = JSON.parse(await getFileAtCommit(relativePackageJsonPath, tagCommit, workspacesCwd));

  let patch = createPatch(oldPackageJson, newPackageJson);

  let changesAffectingRelease = patch.filter(({ path }) => {
    let isMatch = packageJsonDevChangeRegex.test(path);

    return !isMatch;
  });

  return !!changesAffectingRelease.length;
}

async function getChangedReleasableFiles({
  changedFiles,
  packageCwd,
  workspacesCwd,
  shouldExcludeDevChanges,
  tagCommit,
}) {
  changedFiles = new Set(changedFiles);

  let changedPublishedFiles = await _getChangedReleasableFiles({
    cwd: packageCwd,
    changedFiles: map(changedFiles, file => path.relative(packageCwd, path.join(workspacesCwd, file))),
  });

  let relative = path.relative(workspacesCwd, packageCwd);

  changedPublishedFiles = map(changedPublishedFiles, file => path.join(relative, file));

  if (shouldExcludeDevChanges) {
    let relativePackageJsonPath = path.join(relative, 'package.json');

    if (changedPublishedFiles.has(relativePackageJsonPath)) {
      let _isPackageJsonChangeReleasable = await isPackageJsonChangeReleasable({
        relativePackageJsonPath,
        tagCommit,
        workspacesCwd,
      });

      if (!_isPackageJsonChangeReleasable) {
        changedPublishedFiles.delete(relativePackageJsonPath);
      }
    }
  }

  return Array.from(changedPublishedFiles);
}

module.exports = {
  getChangedReleasableFiles,
  packageJsonDevChangeRegex,
};
