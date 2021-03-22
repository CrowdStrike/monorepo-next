# monorepo-next

[![npm version](https://badge.fury.io/js/monorepo-next.svg)](https://badge.fury.io/js/monorepo-next)

Detach monorepo packages from normal linking. Work on breaking changes while gradually updating consumers.

<!-- CODEGEN_CLI_HELP -->

```
next [command]

Commands:
  next attach [package]            attach a package to a detached package to
                                   resume normal linking            [aliases: a]
  next changed-files [packages..]  list changed files
  next changed                     list changed packages
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
  --help                          Show help                            [boolean]
  --version                       Show version number                  [boolean]
  --silent                        Don't print logs and errors
                                                      [boolean] [default: false]
  --push                          git push + tags when done
                                                       [boolean] [default: true]
  --publish                       npm publish when done[boolean] [default: true]
  --bump-in-range-dependencies    If a dependency is still in range, and nothing
                                  changed in my package, still bump my version
                                  and the dependency version.
                                                       [boolean] [default: true]
  --inherit-greater-release-type  If a dependency has a greater release type,
                                  bump my package the with the same release
                                  type.               [boolean] [default: false]
  --exclude-dev-changes           If a change doesn't affect consumers, like a
                                  monorepo dev dep change or manually bumping an
                                  external dev dep, don't count it towards a
                                  package change.     [boolean] [default: false]
  --scripts                       Provide scripts to execute for lifecycle
                                  events (prebump, precommit, etc.,)
                                                                   [default: {}]
  --package-files
                [array] [default: ["package.json","bower.json","manifest.json"]]
  --bump-files
  [array] [default: ["package.json","bower.json","manifest.json","package-lock.j
                                                    son","npm-shrinkwrap.json"]]

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
  --silent                   Don't print logs and errors
                                                      [boolean] [default: false]
```

<!-- CODEGEN_CLI_HELP -->
