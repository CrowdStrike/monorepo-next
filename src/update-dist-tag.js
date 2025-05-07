'use strict';

const { execa } = require('./process');
const buildDepGraph = require('./build-dep-graph');
const {
  getWorkspaceCwd,
  getTagsOnCommit,
} = require('./git');
const { builder } = require('../bin/commands/update-dist-tag');

async function updateDistTag({
  cwd = process.cwd(),
  silent,
  dryRun = builder['dry-run'].default,
  distTag = builder['dist-tag'].default,
  updateDistTagOverride,
} = {}) {
  let workspaceCwd = await getWorkspaceCwd(cwd);

  let workspaceMeta = await buildDepGraph({ workspaceCwd });

  let tags = await getTagsOnCommit(workspaceCwd, 'HEAD');

  for (let tag of tags) {
    let [name] = tag.split(/(?<!^)@/);

    if (workspaceMeta.packages[name].isPrivate) {
      continue;
    }

    // eslint-disable-next-line no-inner-declarations
    async function originalUpdateDistTag() {
      await _updateDistTag({ cwd, silent, tag, distTag, dryRun });
    }

    if (updateDistTagOverride) {
      await updateDistTagOverride({
        cwd,
        originalUpdateDistTag,
        tag,
        distTag,
        dryRun,
      });
    } else {
      await originalUpdateDistTag();
    }
  }
}

async function _updateDistTag({ cwd, silent, tag, distTag, dryRun }) {
  let dryRunArgs = dryRun ? ['--dry-run'] : [];

  await execa('npm', ['dist-tag', 'add', tag, distTag, ...dryRunArgs], { cwd, silent });
}

module.exports = updateDistTag;
