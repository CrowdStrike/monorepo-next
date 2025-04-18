# monorepo-next

[![npm version](https://badge.fury.io/js/monorepo-next.svg)](https://badge.fury.io/js/monorepo-next)

Detach monorepo packages from normal linking. Work on breaking changes while gradually updating consumers.

Each package can have a `monorepo-next.config.js` with the following options:

```js
module.exports = {
  // Set this to false to opt-out of change detection and versioning.
  shouldBumpVersion: true,

  // If your package has a build step, your package.json/files array
  // will be a git-ignored dir, so we can't use that. Use this to
  // allow us to still find changes to your package. This appends
  // to your existing NPM tracked files.
  changeTrackingFiles: ['src/**'],
}
```

<!-- CODEGEN_CLI_HELP -->

```
next [command]

Commands:
  next attach [package]            attach a package to a detached package to
                                   resume normal linking            [aliases: a]
  next changed-files [packages..]  list changed files
  next changed                     list changed packages
  next cycles                      detect circular references
  next defrag                      synchronize all dependency version
                                   discrepancies
  next detach [package]            detach a package from normal linking
                                                                    [aliases: d]
  next release                     release all packages as needed
  next run                         run script against changed packages

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

next attach [package]

attach a package to a detached package to resume normal linking

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

next changed-files [packages..]

list changed files

Options:
  --help                     Show help                                 [boolean]
  --version                  Show version number                       [boolean]
  --ext                      filter by extension                        [string]
  --only-include-releasable  If a file was changed that is not published, don't
                             count it towards a package change.
                                                      [boolean] [default: false]
  --exclude-dev-changes      If a change doesn't affect consumers, like a
                             monorepo dev dep change or manually bumping an
                             external dev dep, don't count it towards a package
                             change.                  [boolean] [default: false]
  --exclude-deleted          Excluded deleted files from the changeset.
                                                      [boolean] [default: false]

next changed

list changed packages

Options:
  --help                     Show help                                 [boolean]
  --version                  Show version number                       [boolean]
  --only-include-releasable  If a file was changed that is not published, don't
                             count it towards a package change.
                                                      [boolean] [default: false]
  --exclude-dev-changes      If a change doesn't affect consumers, like a
                             monorepo dev dep change or manually bumping an
                             external dev dep, don't count it towards a package
                             change.                  [boolean] [default: false]
  --exclude-deleted          Excluded deleted files from the changeset.
                                                      [boolean] [default: false]

next cycles

detect circular references

Options:
  --help                            Show help                          [boolean]
  --version                         Show version number                [boolean]
  --detect-dev-dependencies, --dev  alert when there is a devDependency in the
                                    loop              [boolean] [default: false]

next defrag

synchronize all dependency version discrepancies

Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --include       only synchronize a subset of dependencies[array] [default: []]
  --exclude       ignore a subset of dependencies          [array] [default: []]
  --out-of-range  override ranges that are out of range
                                   [string] [choices: "major", "minor", "patch"]
  --dry-run       log to console instead of modifying files
                                                      [boolean] [default: false]

next detach [package]

detach a package from normal linking

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

next release

release all packages as needed

Options:
  --help                            Show help                          [boolean]
  --version                         Show version number                [boolean]
  --silent                          Don't print logs and errors
                                                      [boolean] [default: false]
  --dry-run                         log to console instead of modifying files
                                                      [boolean] [default: false]
  --push                            git push + tags when done
                                                       [boolean] [default: true]
  --publish                         npm publish when done
                                                       [boolean] [default: true]
  --dist-tag                        publish to a different NPM dist-tag
                                                    [string] [default: "latest"]
  --bump-in-range-dependencies      If a dependency is still in range, and
                                    nothing changed in my package, still bump my
                                    version and the dependency version.
                                                       [boolean] [default: true]
  --inherit-greater-release-type    If a dependency has a greater release type,
                                    bump my package the with the same release
                                    type.             [boolean] [default: false]
  --exclude-dev-changes             If a change doesn't affect consumers, like a
                                    monorepo dev dep change or manually bumping
                                    an external dev dep, don't count it towards
                                    a package change. [boolean] [default: false]
  --validate-dependency-visibility  Prevent releasing public packages that
                                    depend on private packages.
                                                      [boolean] [default: false]
  --clean-up-after-failed-push      If there's already a new commit on the
                                    remote, clean up the commit and tags that
                                    won't be used     [boolean] [default: false]
  --scripts                         Provide scripts to execute for lifecycle
                                    events (prebump, precommit, etc.,)
                                                                   [default: {}]
  --package-files
                [array] [default: ["package.json","bower.json","manifest.json"]]
  --bump-files
  [array] [default: ["package.json","bower.json","manifest.json","package-lock.j
                                                    son","npm-shrinkwrap.json"]]
  --default-branch                                  [string] [default: "master"]

next run

run script against changed packages

Options:
  --help                     Show help                                 [boolean]
  --version                  Show version number                       [boolean]
  --only-include-releasable  If a file was changed that is not published, don't
                             count it towards a package change.
                                                      [boolean] [default: false]
  --exclude-dev-changes      If a change doesn't affect consumers, like a
                             monorepo dev dep change or manually bumping an
                             external dev dep, don't count it towards a package
                             change.                  [boolean] [default: false]
  --exclude-deleted          Excluded deleted files from the changeset.
                                                      [boolean] [default: false]
  --silent                   Don't print logs and errors
                                                      [boolean] [default: false]
```

<!-- CODEGEN_CLI_HELP -->
