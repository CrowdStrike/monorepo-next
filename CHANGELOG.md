# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [13.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v12.5.4...v13.0.0) (2025-07-13)


### ⚠ BREAKING CHANGES

* use node 20
* move precommit hook before `git add`
* update yarn.lock after versioning
* use correct cwd when running lifecycle scripts

* ember-cli-update-action ([4e9c3f8](https://github.com/CrowdStrike/monorepo-next/commit/4e9c3f8bff23e4ad049639b174a2896df11a8a81))


### Features

* move precommit hook before `git add` ([0f77406](https://github.com/CrowdStrike/monorepo-next/commit/0f77406302981a391a5c964d25c230b1e61682c1))


### Bug Fixes

* **deps:** update dependency @npmcli/arborist to v9 ([9733e0e](https://github.com/CrowdStrike/monorepo-next/commit/9733e0eaa4286f45551bf329cb2d21d96291b515))
* **deps:** update dependency inquirer to v12 ([f3e1c0d](https://github.com/CrowdStrike/monorepo-next/commit/f3e1c0d830d0f2d083f1a1a47c84faf3a5fb3e5f))
* **deps:** update dependency minimatch to v10 ([0d52f5e](https://github.com/CrowdStrike/monorepo-next/commit/0d52f5ede50c5c0eca833a3f132a673de17ad2ba))
* **deps:** update dependency npm-packlist to v10 ([868c8b1](https://github.com/CrowdStrike/monorepo-next/commit/868c8b195f9573c3456c16c479cb3971392721c6))
* **deps:** update dependency yargs to v18 ([ee23676](https://github.com/CrowdStrike/monorepo-next/commit/ee23676719770131c8238a2b9b0de5e0a87308d7))
* update yarn.lock after versioning ([1c933e4](https://github.com/CrowdStrike/monorepo-next/commit/1c933e4085e8bb1521825cb8e86f11113198ea8b))
* use correct cwd when running lifecycle scripts ([d3e6a74](https://github.com/CrowdStrike/monorepo-next/commit/d3e6a742bd7b5af866f06ce19b22ef54c301cfb3))

## [12.5.4](https://github.com/CrowdStrike/monorepo-next/compare/v12.5.3...v12.5.4) (2025-07-13)


### Bug Fixes

* **deps:** update dependency commit-and-tag-version to v12.5.1 ([c96390c](https://github.com/CrowdStrike/monorepo-next/commit/c96390c1ecf94ac8cfe84e885a5c8d2dedd84c57))

## [12.5.3](https://github.com/CrowdStrike/monorepo-next/compare/v12.5.2...v12.5.3) (2025-05-07)


### Bug Fixes

* when renaming or moving a file, also add the new file to the changedFiles ([49064a8](https://github.com/CrowdStrike/monorepo-next/commit/49064a8efaf01e61f61a32ce5d9709a4a0770d6d))

## [12.5.2](https://github.com/CrowdStrike/monorepo-next/compare/v12.5.1...v12.5.2) (2025-02-24)


### Bug Fixes

* follow private dependents all the way down ([11e91c3](https://github.com/CrowdStrike/monorepo-next/commit/11e91c3e19f4ee52a5bfc81a498fbeaa58c9b869))

## [12.5.1](https://github.com/CrowdStrike/monorepo-next/compare/v12.5.0...v12.5.1) (2025-02-24)

## [12.5.0](https://github.com/CrowdStrike/monorepo-next/compare/v12.4.1...v12.5.0) (2025-02-21)


### Features

* add `changeTrackingFiles` option to monorepo-next.config.js ([516de7c](https://github.com/CrowdStrike/monorepo-next/commit/516de7c53b33430959cecb4c68a8e9d7fca8e8fd))

## [12.4.1](https://github.com/CrowdStrike/monorepo-next/compare/v12.4.0...v12.4.1) (2025-02-21)

## [12.4.0](https://github.com/CrowdStrike/monorepo-next/compare/v12.3.0...v12.4.0) (2025-02-20)


### Features

* support updating pnpm lockfile ([d561a0b](https://github.com/CrowdStrike/monorepo-next/commit/d561a0b71b8550b7cc5214fca38491681ecc90ee))

## [12.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v12.2.1...v12.3.0) (2025-02-20)


### Features

* use existing range if available ([023073f](https://github.com/CrowdStrike/monorepo-next/commit/023073f41971cfa51e8bebad5e3ee9cb3c52bb15))

## [12.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v12.2.0...v12.2.1) (2025-02-20)


### Bug Fixes

* **deps:** update dependency commit-and-tag-version to v12.5.0 ([631f2d6](https://github.com/CrowdStrike/monorepo-next/commit/631f2d63d30022439c7479cfee20428157612caa))

## [12.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v12.1.1...v12.2.0) (2024-07-24)


### Features

* add shouldValidateDependencyVisibility option ([43198ad](https://github.com/CrowdStrike/monorepo-next/commit/43198ad0334028d3ab4cd658bfcf6b3f51f6d705))

## [12.1.1](https://github.com/CrowdStrike/monorepo-next/compare/v12.1.0...v12.1.1) (2024-07-23)


### Bug Fixes

* log on release branch mismatch ([47cb4a0](https://github.com/CrowdStrike/monorepo-next/commit/47cb4a0f50beb10b8df12d6cea235d5721af6057))

## [12.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v12.0.5...v12.1.0) (2024-07-16)


### Features

* add `dist-tag` to release ([c9204d3](https://github.com/CrowdStrike/monorepo-next/commit/c9204d31c66539c78bc788464d52a38522ce9916))

## [12.0.5](https://github.com/CrowdStrike/monorepo-next/compare/v12.0.4...v12.0.5) (2024-07-12)


### Bug Fixes

* **deps:** update dependency commit-and-tag-version to v12 ([0f347a7](https://github.com/CrowdStrike/monorepo-next/commit/0f347a75531539c3f109e4762c7bdd20de037ceb))

## [12.0.4](https://github.com/CrowdStrike/monorepo-next/compare/v12.0.3...v12.0.4) (2024-07-12)


### Bug Fixes

* **deps:** update dependency commit-and-tag-version to v11.3.0 ([ff71e4c](https://github.com/CrowdStrike/monorepo-next/commit/ff71e4ce944e3605af5fb607baf77d40fb291414))

## [12.0.3](https://github.com/CrowdStrike/monorepo-next/compare/v12.0.2...v12.0.3) (2024-07-12)


### Bug Fixes

* "commit-and-tag-version": "11.2.2" ([20b3da5](https://github.com/CrowdStrike/monorepo-next/commit/20b3da50b7be34b2bc6a8c92bdac8e709c10a1da))

## [12.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v12.0.1...v12.0.2) (2024-07-12)


### Bug Fixes

* "commit-and-tag-version": "11.2.1" ([c0f5868](https://github.com/CrowdStrike/monorepo-next/commit/c0f58684390f60b09b6672e61f463a90f146ef85))

## [12.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v12.0.0...v12.0.1) (2024-07-12)


### Bug Fixes

* "commit-and-tag-version": "11.1.0" ([076eb51](https://github.com/CrowdStrike/monorepo-next/commit/076eb51b495fd6f449a774b6c2cce1af850414ec))

## [12.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v11.4.5...v12.0.0) (2024-07-12)


### ⚠ BREAKING CHANGES

* "commit-and-tag-version": "11.0.0"

* "commit-and-tag-version": "11.0.0" ([5d98c92](https://github.com/CrowdStrike/monorepo-next/commit/5d98c9256ed7a79a52a01450c70cf5bba76654a0))

### [11.4.5](https://github.com/CrowdStrike/monorepo-next/compare/v11.4.4...v11.4.5) (2024-07-12)


### Bug Fixes

* **deps:** update dependency commit-and-tag-version to v10.1.0 ([d6ce7e1](https://github.com/CrowdStrike/monorepo-next/commit/d6ce7e1581e75082b679edb93972d292e23632af))

### [11.4.4](https://github.com/CrowdStrike/monorepo-next/compare/v11.4.3...v11.4.4) (2024-07-12)


### Bug Fixes

* **deps:** update dependency commit-and-tag-version to v9.6.0 ([6eebe5d](https://github.com/CrowdStrike/monorepo-next/commit/6eebe5dc26fe7909150522eeb803b982ba8f270a))

### [11.4.3](https://github.com/CrowdStrike/monorepo-next/compare/v11.4.2...v11.4.3) (2024-07-12)


### Bug Fixes

* swap standard-version for commit-and-tag-version ([821e96b](https://github.com/CrowdStrike/monorepo-next/commit/821e96bb2587f36296bb52d310916ec50380d29b))

### [11.4.2](https://github.com/CrowdStrike/monorepo-next/compare/v11.4.1...v11.4.2) (2024-07-12)

### [11.4.1](https://github.com/CrowdStrike/monorepo-next/compare/v11.4.0...v11.4.1) (2024-07-12)


### Bug Fixes

* **deps:** update dependency inquirer to v10 ([c722888](https://github.com/CrowdStrike/monorepo-next/commit/c7228888b8f406cacd122356405dcd14189eaabe))

## [11.4.0](https://github.com/CrowdStrike/monorepo-next/compare/v11.3.0...v11.4.0) (2024-06-04)


### Features

* add `shouldExcludeDeleted` ([1ea25a9](https://github.com/CrowdStrike/monorepo-next/commit/1ea25a95ae4b33ad5a6500cff33107858c0df200))

## [11.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v11.2.0...v11.3.0) (2024-04-12)


### Features

* add new fs helpers ([8c02f52](https://github.com/CrowdStrike/monorepo-next/commit/8c02f52c66ebdb2ad0bc686a017733fdb635d34a))
* cache git results in files ([7ea1ee8](https://github.com/CrowdStrike/monorepo-next/commit/7ea1ee8476cf906d0785e72b058b3051f605f3c9))
* prepare cache keys to be file names ([0e97810](https://github.com/CrowdStrike/monorepo-next/commit/0e978102845dede42725b98557a6465e0d8d36d5))

## [11.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v11.1.0...v11.2.0) (2024-04-12)


### Features

* add debug logging for git cache ([8e5ae55](https://github.com/CrowdStrike/monorepo-next/commit/8e5ae55578ae2c1965c40036cd27a6a1e4365622))

## [11.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.12...v11.1.0) (2024-04-12)


### Features

* add `shouldRunPerPackage` option ([77c8897](https://github.com/CrowdStrike/monorepo-next/commit/77c88978c51bf58d21d6ce5c6dbf82250ac56ef9))
* enable `shouldRunPerPackage` ([8392b6b](https://github.com/CrowdStrike/monorepo-next/commit/8392b6bc40038f452167f4ed3e1fc2b21c6be259))

### [11.0.12](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.11...v11.0.12) (2024-04-03)


### Bug Fixes

* don't swallow error if unexpected ([5ea36ad](https://github.com/CrowdStrike/monorepo-next/commit/5ea36ad6332859b1df38e7eba7d37bc847f4444f))

### [11.0.11](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.10...v11.0.11) (2024-03-04)


### Bug Fixes

* **deps:** update dependency tmp to v0.2.3 ([9da7b11](https://github.com/CrowdStrike/monorepo-next/commit/9da7b11f383403548d57b9a14104af5e4cefb2c3))

### [11.0.10](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.9...v11.0.10) (2023-12-15)


### Bug Fixes

* fix changelog truncating repository url ([2eee808](https://github.com/CrowdStrike/monorepo-next/commit/2eee808e38e1d0934ee2807ef36321d09767027a))

### [11.0.9](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.8...v11.0.9) (2023-12-05)

### [11.0.8](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.7...v11.0.8) (2023-12-05)


### Bug Fixes

* handle filenames with spaces ([dbf9bee](https://github.com/CrowdStrike/monorepo-next/commit/dbf9bee8185cad1e079c8ed363cc6f494697451c))

### [11.0.7](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.6...v11.0.7) (2023-11-08)


### Bug Fixes

* conventional-recommended-bump now returns promise ([13ab8ba](https://github.com/CrowdStrike/monorepo-next/commit/13ab8bae4857504dc4811c2b273094bb9219ad22))
* **deps:** update dependency conventional-recommended-bump to v9 ([a9431af](https://github.com/CrowdStrike/monorepo-next/commit/a9431afcaaf8c00cd4c4d9a83f1cf8ff5169caa4))

### [11.0.6](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.5...v11.0.6) (2023-11-08)


### Bug Fixes

* update conventional-recommended-bump to v8 ([f8bd553](https://github.com/CrowdStrike/monorepo-next/commit/f8bd5532fec55b4bbb4861f4092a2bff1a0a25fd))

### [11.0.5](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.4...v11.0.5) (2023-11-08)


### Bug Fixes

* update conventional-recommended-bump to v7 ([ba3b282](https://github.com/CrowdStrike/monorepo-next/commit/ba3b2828b76301b2fc08c42e8b24817430f9aaeb))

### [11.0.4](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.3...v11.0.4) (2023-11-08)


### Bug Fixes

* add @npmcli/arborist to support breaking change in npm-packlist ([ca3b0c4](https://github.com/CrowdStrike/monorepo-next/commit/ca3b0c44898fc655f1334a9875959c6c9ae84330))
* **deps:** update dependency npm-packlist to v8 ([838dfaf](https://github.com/CrowdStrike/monorepo-next/commit/838dfaf65dbfcdd07aecf629275832517fad8ec4))

### [11.0.3](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.2...v11.0.3) (2023-11-08)


### Bug Fixes

* use async glob in loadPackageConfig ([9b16657](https://github.com/CrowdStrike/monorepo-next/commit/9b16657c36370b8f78191370b467a0a7cc942df1))

### [11.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.1...v11.0.2) (2023-11-08)


### Bug Fixes

* support esm minimatch ([166e6b2](https://github.com/CrowdStrike/monorepo-next/commit/166e6b27901d5c49a2b1a8a8134bb45013456958))
* **deps:** update dependency minimatch to v9 ([04b8b13](https://github.com/CrowdStrike/monorepo-next/commit/04b8b13e003bcc6da0e1b4a25d7750f21dee9d6e))

### [11.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v11.0.0...v11.0.1) (2023-11-08)


### Bug Fixes

* support esm inquirer ([75bde88](https://github.com/CrowdStrike/monorepo-next/commit/75bde88400e79b2160c1cabf2f155e2d5a68c4bf))
* **deps:** update dependency conventional-changelog to v5 ([03b5330](https://github.com/CrowdStrike/monorepo-next/commit/03b5330d119632bb9da3f5c2d36f3a6867dbc134))
* **deps:** update dependency inquirer to v9 ([2c48cfb](https://github.com/CrowdStrike/monorepo-next/commit/2c48cfb8ccf8d5015cdf2e0fad73bbe782e3b11f))

## [11.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v10.2.1...v11.0.0) (2023-11-08)


### ⚠ BREAKING CHANGES

* require node 18

* Merge pull request #452 from CrowdStrike/renovate/standard-node-template-4.x ([471c6a1](https://github.com/CrowdStrike/monorepo-next/commit/471c6a1b760f40c4ca11ce5a6e0e785e8274e6cd)), closes [#452](https://github.com/CrowdStrike/monorepo-next/issues/452)

### [10.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v10.2.0...v10.2.1) (2023-10-27)


### Bug Fixes

* handle two removed packages that have the same basename ([b0c4c2c](https://github.com/CrowdStrike/monorepo-next/commit/b0c4c2c58e9fa7a6c5df800b53d554b0d09cbae7))

## [10.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v10.1.0...v10.2.0) (2023-09-08)


### Features

* add dry run to push and publish ([bd821cc](https://github.com/CrowdStrike/monorepo-next/commit/bd821cc73e0e5ec3d6327cd599289e368b86752f))

## [10.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v10.0.1...v10.1.0) (2023-09-08)


### Features

* handle piping in new process helper ([5d47fe7](https://github.com/CrowdStrike/monorepo-next/commit/5d47fe709d28e636ab22175f031a36a6f1cff6ce))

### [10.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v10.0.0...v10.0.1) (2023-09-06)


### Bug Fixes

* fix silent regression ([833e4e4](https://github.com/CrowdStrike/monorepo-next/commit/833e4e42396c3c1298498d056ae321c9beef4b10))

## [10.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.13...v10.0.0) (2023-09-06)

### [9.4.13](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.12...v9.4.13) (2023-09-06)

### [9.4.12](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.11...v9.4.12) (2023-08-16)


### Bug Fixes

* don't traverse dependents if we've already processed this node ([ef3e3d2](https://github.com/CrowdStrike/monorepo-next/commit/ef3e3d22bc8d5f4aa3e37e3fd925bf65a5617063))

### [9.4.11](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.10...v9.4.11) (2023-08-16)


### Bug Fixes

* early exit if we don't need to upgrade the release type ([4369f81](https://github.com/CrowdStrike/monorepo-next/commit/4369f81b53f02edf796f31281342dc6939f20fda))

### [9.4.10](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.9...v9.4.10) (2023-08-16)


### Bug Fixes

* early exit if child is of greater release type ([a142ea4](https://github.com/CrowdStrike/monorepo-next/commit/a142ea4f2ef109f2e0e1cfcf3355c0d29314ca5b))

### [9.4.9](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.8...v9.4.9) (2023-08-16)


### Bug Fixes

* early exit if no upgrades needed ([a8244f4](https://github.com/CrowdStrike/monorepo-next/commit/a8244f430ccf2aae89dc6a9c9cd63f1d294ada63))

### [9.4.8](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.7...v9.4.8) (2023-08-16)


### Bug Fixes

* early exit if root node and no upgrades to follow ([953dd5e](https://github.com/CrowdStrike/monorepo-next/commit/953dd5ea7cf6ec43781104024119ff9f7d8edacc))

### [9.4.7](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.6...v9.4.7) (2023-08-16)

### [9.4.6](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.5...v9.4.6) (2023-08-16)


### Bug Fixes

* don't calc release type when shouldBumpVersion is false ([2d72cec](https://github.com/CrowdStrike/monorepo-next/commit/2d72cec18124626983e49a86c156b67bb585d663))

### [9.4.5](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.4...v9.4.5) (2023-08-16)


### Bug Fixes

* fix shouldBumpVersion when opting out via config ([30a9b19](https://github.com/CrowdStrike/monorepo-next/commit/30a9b1945ebebc1f9071db0febafebd8d3174d8d))

### [9.4.4](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.3...v9.4.4) (2023-08-16)


### Bug Fixes

* still traverse dependents when first devDep is found ([3ed56c7](https://github.com/CrowdStrike/monorepo-next/commit/3ed56c7b657a06a3cb5d4bf95d9d30a2c8933a51))

### [9.4.3](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.2...v9.4.3) (2023-08-16)


### Bug Fixes

* fix logger ([2d68b9e](https://github.com/CrowdStrike/monorepo-next/commit/2d68b9e32e85cffdf710cf44aadc5474538f533f))

### [9.4.2](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.1...v9.4.2) (2023-08-16)

### [9.4.1](https://github.com/CrowdStrike/monorepo-next/compare/v9.4.0...v9.4.1) (2023-08-16)

## [9.4.0](https://github.com/CrowdStrike/monorepo-next/compare/v9.3.5...v9.4.0) (2023-08-14)


### Features

* add some logging to the release ([c00cc44](https://github.com/CrowdStrike/monorepo-next/commit/c00cc44f40bd135c14aeee272bed961726fc938d))

### [9.3.5](https://github.com/CrowdStrike/monorepo-next/compare/v9.3.4...v9.3.5) (2023-06-29)


### Bug Fixes

* don't try to clean up during dry run ([a2dae97](https://github.com/CrowdStrike/monorepo-next/commit/a2dae97c7e245bbca16b9efa8f529a2a10eb0d53))

### [9.3.4](https://github.com/CrowdStrike/monorepo-next/compare/v9.3.3...v9.3.4) (2023-06-26)


### Bug Fixes

* float semver package version range ([201050d](https://github.com/CrowdStrike/monorepo-next/commit/201050dd619526ca97cbdd0daa3b7abbf65bf737))
* **deps:** update dependency semver to v7.5.3 ([8063d32](https://github.com/CrowdStrike/monorepo-next/commit/8063d323362f0130c66d7fad5fe11f745c2df01e))

### [9.3.3](https://github.com/CrowdStrike/monorepo-next/compare/v9.3.2...v9.3.3) (2023-06-20)


### Bug Fixes

* **deps:** update dependency semver to v7.5.2 ([0ccd71c](https://github.com/CrowdStrike/monorepo-next/commit/0ccd71cb1e8af0ac1b9ae5fd3eb09bc281979122))

### [9.3.2](https://github.com/CrowdStrike/monorepo-next/compare/v9.3.1...v9.3.2) (2023-06-06)


### Bug Fixes

* add some missing uses of `cached` ([17d567e](https://github.com/CrowdStrike/monorepo-next/commit/17d567e1958b26206c910f220d141e9925e19bb7))

### [9.3.1](https://github.com/CrowdStrike/monorepo-next/compare/v9.3.0...v9.3.1) (2023-06-06)


### Features

* run ls-tree instead of diff if new package ([aa42921](https://github.com/CrowdStrike/monorepo-next/commit/aa429218f316a255b90ea48d5a1f75191eadbad0))


### Bug Fixes

* add some missing uses of `cached` ([bc4c037](https://github.com/CrowdStrike/monorepo-next/commit/bc4c037c7e9a8247485ac84fc90d56a7e2c1092d))

## [9.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.6...v9.3.0) (2023-05-31)


### Features

* add --dry-run to release ([2460b6a](https://github.com/CrowdStrike/monorepo-next/commit/2460b6ac36771fd9df24d5fabc65abbaac00ab91))


### Bug Fixes

* **deps:** update dependency semver to v7.5.1 ([b3711fa](https://github.com/CrowdStrike/monorepo-next/commit/b3711fa031ae5d313526e6f6acf4428d652c9712))

### [9.2.6](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.5...v9.2.6) (2023-04-17)


### Bug Fixes

* **deps:** update dependency semver to v7.5.0 ([0d1f542](https://github.com/CrowdStrike/monorepo-next/commit/0d1f5423da8a593a25abd64cebc9991845e87637))

### [9.2.5](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.4...v9.2.5) (2023-04-13)


### Bug Fixes

* **deps:** update dependency semver to v7.4.0 ([1ffe565](https://github.com/CrowdStrike/monorepo-next/commit/1ffe5659e7db427af39bd901ccd5ed7d8c04db0e))

### [9.2.4](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.3...v9.2.4) (2023-04-11)


### Bug Fixes

* order a cycle by first alpha package name ([fd92e8f](https://github.com/CrowdStrike/monorepo-next/commit/fd92e8f7c939f7f3e6595abd5f66d45baaa41b43))

### [9.2.3](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.2...v9.2.3) (2023-04-11)


### Bug Fixes

* detect subset cycles ([e5c1415](https://github.com/CrowdStrike/monorepo-next/commit/e5c1415afa182958f4fd2cf498d91a29cee0f07a))

### [9.2.2](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.1...v9.2.2) (2023-04-11)

### [9.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v9.2.0...v9.2.1) (2023-04-03)


### Bug Fixes

* always sort Object.keys to be deterministic ([809643a](https://github.com/CrowdStrike/monorepo-next/commit/809643ac9e1e4a50678d94114947aa7f0191e701))

## [9.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v9.1.1...v9.2.0) (2023-03-21)


### Features

* add `cycles` command ([4143b7c](https://github.com/CrowdStrike/monorepo-next/commit/4143b7ccffa91c0311944c3e4e1bcaca5a16482d))
* add `detectCircularReferences` ([6c080b2](https://github.com/CrowdStrike/monorepo-next/commit/6c080b2638fb4abf98b859d552947b692b14b22f))
* add `getCycles` ([4f061f5](https://github.com/CrowdStrike/monorepo-next/commit/4f061f5d6e1faece0a336e0cbccacf35b5853256))

### [9.1.1](https://github.com/CrowdStrike/monorepo-next/compare/v9.1.0...v9.1.1) (2023-03-07)


### Bug Fixes

* fix ENOTDIR error ([b4cfb70](https://github.com/CrowdStrike/monorepo-next/commit/b4cfb70d62f99821d9159eef49501608a5808a85))

## [9.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v9.0.2...v9.1.0) (2022-11-29)


### Features

* add support for CJS config file extension ([94b77bc](https://github.com/CrowdStrike/monorepo-next/commit/94b77bc66f31c82f3b83f44328ffb54ae38be027))

### [9.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v9.0.1...v9.0.2) (2022-10-20)


### Bug Fixes

* speed up `removeSubDirs` ([cd53585](https://github.com/CrowdStrike/monorepo-next/commit/cd53585d94c96b462a796d82171a23b8c41f03e3))

### [9.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v9.0.0...v9.0.1) (2022-10-18)


### Bug Fixes

* accommodate removed package jsons ([4b47138](https://github.com/CrowdStrike/monorepo-next/commit/4b47138a0a9a9f316df4c047ba4395435229e6e4))
* **deps:** update dependency semver to v7.3.8 ([3847a59](https://github.com/CrowdStrike/monorepo-next/commit/3847a5986fba9dd28883b39cd0e9dd8070015c37))

## [9.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.6.2...v9.0.0) (2022-09-26)


### ⚠ BREAKING CHANGES

* This fix means everyone using `changedFiles.packages` needs to update to a full relative path instead of just the basename. For example, a package at "packages/my-package" will go from:

```js
changedFiles({
  packages: ['my-package'],
})
```

to

```js
changedFiles({
  packages: ['packages/my-package'],
})
```

### Bug Fixes

* **deps:** update dependency npm-packlist to v6 ([978646e](https://github.com/CrowdStrike/monorepo-next/commit/978646ee8a705fa3af8df720a4c63f2470c57cae))
* support packages with same basename ([36ebc7a](https://github.com/CrowdStrike/monorepo-next/commit/36ebc7a9114cf50ada82479e214d052926e3b6cf))

### [8.6.2](https://github.com/CrowdStrike/monorepo-next/compare/v8.6.1...v8.6.2) (2022-09-17)


### Bug Fixes

* cycles only come from visitedNodes, so we can remove these cycle checks ([ad1cdbb](https://github.com/CrowdStrike/monorepo-next/commit/ad1cdbb7d539e80a0d71f75a8be28b8d8c96b44a))
* save cycle status instead of recalculating ([f9842cc](https://github.com/CrowdStrike/monorepo-next/commit/f9842cc22072f136cf40c8704c11fd8c5b8a5d5d))

### [8.6.1](https://github.com/CrowdStrike/monorepo-next/compare/v8.6.0...v8.6.1) (2022-08-15)


### Bug Fixes

* match dot files with minimatch ([9933f41](https://github.com/CrowdStrike/monorepo-next/commit/9933f411f2d529192dc556b99be5ddf78ebbbc14))

## [8.6.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.5.1...v8.6.0) (2022-08-15)


### Features

* add globbing as default instead of spawing packagemanagers ([c88852b](https://github.com/CrowdStrike/monorepo-next/commit/c88852ba093e2b7125eecedab28249b3e1f6e89d))
* duplicate all tests using `shouldSpawn: true` ([d5f7b3b](https://github.com/CrowdStrike/monorepo-next/commit/d5f7b3bc83b1d32565d9a7d36dd5b11b5098a638))


### Bug Fixes

* correctly handle changes across branches ([0b6cd4c](https://github.com/CrowdStrike/monorepo-next/commit/0b6cd4c75e6db05ffc6d9daef7e384fbc8fda4be))

### [8.5.1](https://github.com/CrowdStrike/monorepo-next/compare/v8.5.0...v8.5.1) (2022-08-02)


### Bug Fixes

* handles a dir of files converted to a single file where the dir was ([7d55461](https://github.com/CrowdStrike/monorepo-next/commit/7d55461c57b35e546ebd766ddd93d28d4d9c491e))

## [8.5.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.4.1...v8.5.0) (2022-08-01)


### Features

* add feature to return workspaces synchronous ([c214187](https://github.com/CrowdStrike/monorepo-next/commit/c21418750c9829083e7d2b2d508663803fdc1102))

### [8.4.1](https://github.com/CrowdStrike/monorepo-next/compare/v8.4.0...v8.4.1) (2022-08-01)


### Bug Fixes

* add `private: true` to support yarn workspaces ([c6410ed](https://github.com/CrowdStrike/monorepo-next/commit/c6410ed70402d36c896f963c55dc084288920b27))
* fix failing test when using `yarn workspaces list` command to read workspaces ([73dc089](https://github.com/CrowdStrike/monorepo-next/commit/73dc089fa1383d4d441b9fdbb006325834194148))

## [8.4.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.3.1...v8.4.0) (2022-07-26)


### Features

* add getWorkspacesPaths to monorepo-next ([26caefe](https://github.com/CrowdStrike/monorepo-next/commit/26caefebdd0793ad90906c7a61b2b7d089a4f88c))

### [8.3.1](https://github.com/CrowdStrike/monorepo-next/compare/v8.3.0...v8.3.1) (2022-07-25)


### Bug Fixes

* remove now unused `packagesGlobs` ([4207fb5](https://github.com/CrowdStrike/monorepo-next/commit/4207fb5ee8bf27d39c5fbb7c13899a79ef5e542f))

## [8.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.2.0...v8.3.0) (2022-07-22)


### Features

* add support for `monorepo-next.config.js` ([76738fb](https://github.com/CrowdStrike/monorepo-next/commit/76738fb83dcb09d04766f94309e18deebd285a80))

## [8.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.1.1...v8.2.0) (2022-06-02)


### Features

* early exit some crawlDag calls ([09d5718](https://github.com/CrowdStrike/monorepo-next/commit/09d57187f348f9d3a05b1220f18af5a2dcd629cb))

### [8.1.1](https://github.com/CrowdStrike/monorepo-next/compare/v8.1.0...v8.1.1) (2022-06-02)

## [8.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v8.0.4...v8.1.0) (2022-06-02)


### Features

* early exit some crawlDag calls ([74c783a](https://github.com/CrowdStrike/monorepo-next/commit/74c783a8691d6acce455faa5f59a96de2b8455cd))

### [8.0.4](https://github.com/CrowdStrike/monorepo-next/compare/v8.0.3...v8.0.4) (2022-06-01)


### Bug Fixes

* make `releaseType` set after the fact ([dc2814e](https://github.com/CrowdStrike/monorepo-next/commit/dc2814ec126a2bee663d6af83e38257a083ab020))
* make `shouldVersionBump` a Symbol method ([314c5d8](https://github.com/CrowdStrike/monorepo-next/commit/314c5d8d769685d0b2b1eb6eb13983b4a50af628))
* remove `group.node.isPackage` check ([5edb2b9](https://github.com/CrowdStrike/monorepo-next/commit/5edb2b979463abecb78dc16492922b940883d000))

### [8.0.3](https://github.com/CrowdStrike/monorepo-next/compare/v8.0.2...v8.0.3) (2022-06-01)


### Bug Fixes

* always use default release type to start ([378f429](https://github.com/CrowdStrike/monorepo-next/commit/378f429d791b525e30e1a2b2dd8bb53347c6c363))

### [8.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v8.0.1...v8.0.2) (2022-06-01)

### [8.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v8.0.0...v8.0.1) (2022-06-01)


### Bug Fixes

* prevent duplicate dependencies in releaseTrees ([e96a471](https://github.com/CrowdStrike/monorepo-next/commit/e96a471d65da49108c92a8b856df9484b4495dd4))

## [8.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v7.3.0...v8.0.0) (2022-05-27)


### Bug Fixes

* use `execa` instead of `execa.command` ([038acd8](https://github.com/CrowdStrike/monorepo-next/commit/038acd8619f2ec6e6132d94cbbe8e8f466fa4662))
* **deps:** update dependency glob to v8 ([4aaa5fe](https://github.com/CrowdStrike/monorepo-next/commit/4aaa5fea264ce16067c42d21102881db02ee50f8))
* **deps:** update dependency npm-packlist to v5 ([40d782d](https://github.com/CrowdStrike/monorepo-next/commit/40d782de1a72c5e8994564eed8bdfe8a0bb7fc72))
* **deps:** update dependency semver to v7.3.7 ([b8bdccb](https://github.com/CrowdStrike/monorepo-next/commit/b8bdccb952a7ac0cddfe948200997109a67e57c7))
* **deps:** update dependency standard-version to v9.5.0 ([930eb20](https://github.com/CrowdStrike/monorepo-next/commit/930eb20da14f4cf84ec71cfe445cf0ca8dc942f3))

## [7.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v7.2.4...v7.3.0) (2022-03-04)


### Features

* short-circuit buildDAG ([3ee1e03](https://github.com/CrowdStrike/monorepo-next/commit/3ee1e03d621d1b8a27eeaffe68e5c68ca82a52bb))

### [7.2.4](https://github.com/CrowdStrike/monorepo-next/compare/v7.2.3...v7.2.4) (2022-03-04)


### Bug Fixes

* **deps:** update dependency npm-packlist to v4 ([0737ce2](https://github.com/CrowdStrike/monorepo-next/commit/0737ce2ae8467dc2c89aff86d57e41b5409e8907))

### [7.2.3](https://github.com/CrowdStrike/monorepo-next/compare/v7.2.2...v7.2.3) (2022-03-04)


### Bug Fixes

* test missing version ([5fdfb1d](https://github.com/CrowdStrike/monorepo-next/commit/5fdfb1dce3f21f3592fbb03df969569b8914e984))

### [7.2.2](https://github.com/CrowdStrike/monorepo-next/compare/v7.2.1...v7.2.2) (2022-02-15)


### Bug Fixes

* **deps:** update dependency minimatch to v5 ([9d3ac9c](https://github.com/CrowdStrike/monorepo-next/commit/9d3ac9c1757851c8307ecc655f9467e92d2f2ed4))

### [7.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v7.2.0...v7.2.1) (2022-02-04)

## [7.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v7.1.2...v7.2.0) (2022-01-22)


### Features

* add release `--default-branch` option ([b4dc55d](https://github.com/CrowdStrike/monorepo-next/commit/b4dc55d14d336255f677dd767bea5d1841c847a8))

### [7.1.2](https://github.com/CrowdStrike/monorepo-next/compare/v7.1.1...v7.1.2) (2022-01-05)


### Bug Fixes

* **deps:** update dependency rfc6902 to v5 ([2259dfa](https://github.com/CrowdStrike/monorepo-next/commit/2259dfaa3f2661672e4efcab4ee59aa1eb07c056))

### [7.1.1](https://github.com/CrowdStrike/monorepo-next/compare/v7.1.0...v7.1.1) (2022-01-05)


### Bug Fixes

* **deps:** update dependency conventional-changelog to v3.1.25 ([a65bf5f](https://github.com/CrowdStrike/monorepo-next/commit/a65bf5f5281287922d2f806b2d326ebd8418a5cb))

## [7.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v7.0.1...v7.1.0) (2021-11-02)


### Features

* expose toCommit in `changed` and `changedFiles` ([c66b79e](https://github.com/CrowdStrike/monorepo-next/commit/c66b79e59cd447df93256cb2a68cfa018a94291f))

### [7.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v7.0.0...v7.0.1) (2021-10-27)


### Bug Fixes

* **deps:** update dependency standard-version to v9.3.2 ([472d5e7](https://github.com/CrowdStrike/monorepo-next/commit/472d5e7b26163f7bd68f84579cec8a19540f37c9))

## [7.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v6.3.1...v7.0.0) (2021-09-15)


### ⚠ BREAKING CHANGES

* this only affects changed and nothing else

### Features

* return only list of changed package names ([75840e9](https://github.com/CrowdStrike/monorepo-next/commit/75840e91501530ed1e4098893aad051f243e45ce))

### [6.3.1](https://github.com/CrowdStrike/monorepo-next/compare/v6.3.0...v6.3.1) (2021-08-23)


### Bug Fixes

* **deps:** update dependency npm-packlist to v3 ([8b43e29](https://github.com/CrowdStrike/monorepo-next/commit/8b43e2945829562d1bd1f577549980a27a2f70ce))

## [6.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v6.2.2...v6.3.0) (2021-08-20)


### Features

* globs for changedFiles ([e67e7ca](https://github.com/CrowdStrike/monorepo-next/commit/e67e7ca99d25c3b789b803e41484b48ce0e9af83))


### Bug Fixes

* case for missing globs & exts ([c29d23b](https://github.com/CrowdStrike/monorepo-next/commit/c29d23b57e693d332553a6a567248d5c41bac14c))
* make the changedFiles code easier to reason about ([2963ab3](https://github.com/CrowdStrike/monorepo-next/commit/2963ab31ee7595a2242498add54c74e89772ae64))
* refactor globs to use globs ([5b60cd6](https://github.com/CrowdStrike/monorepo-next/commit/5b60cd621172f0efdd9cfa23ad767553cfab32b7))
* remove duplicated tests ([b5d1347](https://github.com/CrowdStrike/monorepo-next/commit/b5d13479217dbbd95184eeeb4c5add52b3b992f2))

### [6.2.2](https://github.com/CrowdStrike/monorepo-next/compare/v6.2.1...v6.2.2) (2021-07-21)


### Bug Fixes

* assert for unexpected dirs ([292a72c](https://github.com/CrowdStrike/monorepo-next/commit/292a72c0c85a17c806da62e20b623377c57b1dbd))
* strip dirs from git status ([163b37e](https://github.com/CrowdStrike/monorepo-next/commit/163b37ed6ac6ec3f2b84ba8d5abb5ee1eae1f0be))

### [6.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v6.2.0...v6.2.1) (2021-07-14)


### Bug Fixes

* **deps:** update dependency standard-version to v9.3.1 ([0c997d2](https://github.com/CrowdStrike/monorepo-next/commit/0c997d2e043ee172d0f97e1732fa4c7ec8a340cf))

## [6.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v6.1.0...v6.2.0) (2021-07-01)


### Features

* add debug logging to git ([1f3bdca](https://github.com/CrowdStrike/monorepo-next/commit/1f3bdcabda8065d9bcadb0d8df8fbf88b5aa05fc))

## [6.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v6.0.0...v6.1.0) (2021-06-16)


### Features

* clean up commit and tags after failed push ([a1d9171](https://github.com/CrowdStrike/monorepo-next/commit/a1d91714de846e346fd80a4e5ba50f6102907b80))

## [6.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v5.1.1...v6.0.0) (2021-05-08)


### ⚠ BREAKING CHANGES

* bump node 12

### Features

* bump node 12 ([0fbd705](https://github.com/CrowdStrike/monorepo-next/commit/0fbd70557e6288010a38b9ff573e43709d90dcf4))


### Bug Fixes

* **deps:** update dependency inquirer to v8 ([ee7304d](https://github.com/CrowdStrike/monorepo-next/commit/ee7304d51ff2e869ad1b108ec084c0af9632561c))
* **deps:** update dependency standard-version to v9.3.0 ([9928d9a](https://github.com/CrowdStrike/monorepo-next/commit/9928d9ab1812c7e45e4d933f19f491f0532dd90d))
* **deps:** update dependency yargs to v17 ([7036e39](https://github.com/CrowdStrike/monorepo-next/commit/7036e396bc22a06fc107b7a1a95ab6bbc6e43402))

### [5.1.1](https://github.com/CrowdStrike/monorepo-next/compare/v5.1.0...v5.1.1) (2021-04-23)


### Bug Fixes

* `fromCommitIfNewer` ignores deleted commits ([1023d71](https://github.com/CrowdStrike/monorepo-next/commit/1023d71c95995414d249b02b310249b6a23cfbf3))

## [5.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v5.0.0...v5.1.0) (2021-04-16)


### Features

* add `fromCommitIfNewer` ([3406876](https://github.com/CrowdStrike/monorepo-next/commit/3406876adf76e53eb7f15d2314738d66dea006f8))

## [5.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v4.3.4...v5.0.0) (2021-04-15)


### ⚠ BREAKING CHANGES

* The `silent` option is removed from the js functions, and the js functions no longer log to console.

### Bug Fixes

* remove logging of js `changed` and `changedFiles` ([2fd8921](https://github.com/CrowdStrike/monorepo-next/commit/2fd89213a959727e18b856aba212dc03621977bf))

### [4.3.4](https://github.com/CrowdStrike/monorepo-next/compare/v4.3.3...v4.3.4) (2021-04-07)


### Bug Fixes

* **deps:** update dependency standard-version to v9.2.0 ([536d9ed](https://github.com/CrowdStrike/monorepo-next/commit/536d9edd38b96579a13081f487f06e17cf0e7b4b))

### [4.3.3](https://github.com/CrowdStrike/monorepo-next/compare/v4.3.2...v4.3.3) (2021-03-29)


### Bug Fixes

* assume patch level as default ([f446d5d](https://github.com/CrowdStrike/monorepo-next/commit/f446d5d4c41a49a392b8c162193adb6feda83117))

### [4.3.2](https://github.com/CrowdStrike/monorepo-next/compare/v4.3.1...v4.3.2) (2021-03-25)


### Bug Fixes

* undefined `from` is overwriting any default value internally ([7d2c2e8](https://github.com/CrowdStrike/monorepo-next/commit/7d2c2e8bc8500267254989dabfa70f8a1c7be6e3))

### [4.3.1](https://github.com/CrowdStrike/monorepo-next/compare/v4.3.0...v4.3.1) (2021-03-23)


### Bug Fixes

* **deps:** update dependency semver to v7.3.5 ([e88f02c](https://github.com/CrowdStrike/monorepo-next/commit/e88f02c052fe35f6b45592ea75aeef65e054f471))

## [4.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v4.2.1...v4.3.0) (2021-03-22)


### Features

* exclude manual devDependency changes from releasability ([eb10971](https://github.com/CrowdStrike/monorepo-next/commit/eb10971b27e2a41b802595ec625fdc0167cc02d8))


### Bug Fixes

* add option to exclude monorepo devDependency changes from releasability ([63ecd3c](https://github.com/CrowdStrike/monorepo-next/commit/63ecd3c4df323004d6ebfe984c1df973b7f671ea))

### [4.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v4.2.0...v4.2.1) (2021-03-22)


### Bug Fixes

* don't accidentally wipe injected files ([cf24355](https://github.com/CrowdStrike/monorepo-next/commit/cf243550f37acd78a7f55f7d57a1b35e7d071231))

## [4.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v4.1.0...v4.2.0) (2021-03-19)


### Features

* only consider published code as releasable ([942f3ea](https://github.com/CrowdStrike/monorepo-next/commit/942f3ea540b3bd4b44349aeae378b4bb65348148))

## [4.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v4.0.2...v4.1.0) (2021-03-19)


### Features

* don't cascade npm ignored changes to dependencies ([8a91b08](https://github.com/CrowdStrike/monorepo-next/commit/8a91b08a9a5b72b09c607e9f7010777a9b8b89e8))

### [4.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v4.0.1...v4.0.2) (2021-03-18)


### Bug Fixes

* don't version bump if dev dep changes ([2203d91](https://github.com/CrowdStrike/monorepo-next/commit/2203d917b6013ce9172fc2a2625136e3bfd470bb))

### [4.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v4.0.0...v4.0.1) (2021-03-18)


### Bug Fixes

* don't attempt publish if can't version bump ([426ac5e](https://github.com/CrowdStrike/monorepo-next/commit/426ac5eb79b5828612c5785504f1e1a6d0e9f9bc))

## [4.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v3.2.3...v4.0.0) (2021-03-17)


### ⚠ BREAKING CHANGES

* rename `bin/index.js` to `bin/next.js`

* rename `bin/index.js` to `bin/next.js` ([23a9818](https://github.com/CrowdStrike/monorepo-next/commit/23a9818d17022f9079e96da41a0529af7f3c6d8c))

### [3.2.3](https://github.com/CrowdStrike/monorepo-next/compare/v3.2.2...v3.2.3) (2021-03-17)

### [3.2.2](https://github.com/CrowdStrike/monorepo-next/compare/v3.2.1...v3.2.2) (2021-03-16)


### Bug Fixes

* ignore dotfile child package changes in root package ([3ac3237](https://github.com/CrowdStrike/monorepo-next/commit/3ac3237531d304130e0e86993f621188ab36390b))

### [3.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v3.2.0...v3.2.1) (2021-03-16)


### Bug Fixes

* ignore catch-all ranges in defrag ([3ce095a](https://github.com/CrowdStrike/monorepo-next/commit/3ce095ad1b04fa92228d38f0be069e7a11293660))

## [3.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v3.1.0...v3.2.0) (2021-03-16)


### Features

* add defrag command ([2a2fb6e](https://github.com/CrowdStrike/monorepo-next/commit/2a2fb6e8d963b5b4169d560c26673160d1b807d7))

## [3.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v3.0.3...v3.1.0) (2021-03-15)


### Features

* store `packagesGlobs` on `workspaceMeta` ([239c430](https://github.com/CrowdStrike/monorepo-next/commit/239c4307a4225f85eb8c37674ad30b2fd3abd9cb))


### Bug Fixes

* ignores old child package changes in root package ([959644f](https://github.com/CrowdStrike/monorepo-next/commit/959644f988cde83f17c33f4f662d1468826202aa))
* remove unnecessary async ([cf0ed32](https://github.com/CrowdStrike/monorepo-next/commit/cf0ed32e1c9ef24ff938559f40cbd9370ca7e698))

### [3.0.3](https://github.com/CrowdStrike/monorepo-next/compare/v3.0.2...v3.0.3) (2021-02-18)

### [3.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v3.0.1...v3.0.2) (2021-02-18)


### Bug Fixes

* **deps:** update dependency standard-version to v9.1.1 ([1ed4461](https://github.com/CrowdStrike/monorepo-next/commit/1ed4461a65f721eaaedec4634e5ec67bbb3a5a42))

### [3.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v3.0.0...v3.0.1) (2021-02-09)

## [3.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.8.2...v3.0.0) (2021-01-12)


### ⚠ BREAKING CHANGES

* The object structure has changed.

### Features

* expose old version and release type in `getNewVersions` ([8a83aeb](https://github.com/CrowdStrike/monorepo-next/commit/8a83aebd1bd6a014c3df62304ab03af1ea4a8a5c))

### [2.8.2](https://github.com/CrowdStrike/monorepo-next/compare/v2.8.1...v2.8.2) (2020-12-31)


### Bug Fixes

* **deps:** update dependency conventional-recommended-bump to v6.1.0 ([61e62f2](https://github.com/CrowdStrike/monorepo-next/commit/61e62f20f517c3f687100fe20abe29c29dce7c1e))
* **deps:** update dependency standard-version to v9.1.0 ([cd15194](https://github.com/CrowdStrike/monorepo-next/commit/cd1519466e6d845f7cfdba421623f73a847a4450))

### [2.8.1](https://github.com/CrowdStrike/monorepo-next/compare/v2.8.0...v2.8.1) (2020-12-22)


### Bug Fixes

* **deps:** update dependency semver to v7.3.4 ([6d1529d](https://github.com/CrowdStrike/monorepo-next/commit/6d1529d3bc968dbacbe7e943664eadb435d8dc90))
* fix change in semver package ([ad3bfce](https://github.com/CrowdStrike/monorepo-next/commit/ad3bfcec2c6843b4199ef19257c64cbe491192ff))
* pin semver package ([6526e60](https://github.com/CrowdStrike/monorepo-next/commit/6526e607a8d98445e1132f88d22aae6d301519bb))
* support the internal semver change ([03e2d48](https://github.com/CrowdStrike/monorepo-next/commit/03e2d48aa4e282e68fd633287590a06f939290c1))
* update semver to 7.3.2 ([d912dca](https://github.com/CrowdStrike/monorepo-next/commit/d912dcaa9356281cc50d52a29058ac7287e73e2f))
* update to last non-breaking semver version ([e93f683](https://github.com/CrowdStrike/monorepo-next/commit/e93f683654560c9e4dd382d645a75e2e7e135123))

## [2.8.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.7.2...v2.8.0) (2020-12-22)


### Features

* don't increment changelog version if going backwards ([5744fc3](https://github.com/CrowdStrike/monorepo-next/commit/5744fc320cec4ab8a48789c3b9bc517a3d769506))

### [2.7.2](https://github.com/CrowdStrike/monorepo-next/compare/v2.7.1...v2.7.2) (2020-12-22)


### Bug Fixes

* never use `require` to load `package.json` ([4e467c6](https://github.com/CrowdStrike/monorepo-next/commit/4e467c62764940042538dc04838a0f9dfb91e550))

### [2.7.1](https://github.com/CrowdStrike/monorepo-next/compare/v2.7.0...v2.7.1) (2020-12-21)


### Bug Fixes

* fix bad github merge ([c171250](https://github.com/CrowdStrike/monorepo-next/commit/c17125068023eac09a1dc8a73644fd27f482b201))

## [2.7.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.6.1...v2.7.0) (2020-12-21)


### Features

* add caching to git helper ([af9eeea](https://github.com/CrowdStrike/monorepo-next/commit/af9eeea7ca65bd9180ffdc56773ba8df3197b0f8))
* add more git caching ([9054bf3](https://github.com/CrowdStrike/monorepo-next/commit/9054bf3119f2af263fd2ebc5ccebdfdfdb17fdb7))

### [2.6.1](https://github.com/CrowdStrike/monorepo-next/compare/v2.6.0...v2.6.1) (2020-12-21)


### Bug Fixes

* cache `sinceBranchCommit` outside loop ([ca01198](https://github.com/CrowdStrike/monorepo-next/commit/ca011984a5b1329e1760aa1637c95b03c2b63a7e))

## [2.6.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.5.0...v2.6.0) (2020-12-04)


### Features

* create `getNewVersions` public api ([13743b6](https://github.com/CrowdStrike/monorepo-next/commit/13743b62b8a15c8e0106e674c2c1d161e183eb58))


### Bug Fixes

* **deps:** update dependency execa to v5 ([b6add97](https://github.com/CrowdStrike/monorepo-next/commit/b6add97565195c3b4387356e2f9f58776ee7fd01))

## [2.5.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.4.0...v2.5.0) (2020-12-02)


### Features

* expose `getLatestReleaseCommit` ([827193b](https://github.com/CrowdStrike/monorepo-next/commit/827193b3b8617a074ebf63493bdcc8ab9072c276))

## [2.4.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.3.2...v2.4.0) (2020-12-01)


### Features

* pass `cached` option from `getChangelog` to `buildChangeGraph` ([fe72b65](https://github.com/CrowdStrike/monorepo-next/commit/fe72b6528c2bcfaffc43555a1654503bcb26597f))
* support `fromCommit` in `getChangelog` ([2f1e238](https://github.com/CrowdStrike/monorepo-next/commit/2f1e23894cec4405f1b60cff02dda72cf57404ce))

### [2.3.2](https://github.com/CrowdStrike/monorepo-next/compare/v2.3.1...v2.3.2) (2020-11-30)


### Bug Fixes

* **deps:** update dependency conventional-changelog to v3.1.24 ([77059ae](https://github.com/CrowdStrike/monorepo-next/commit/77059ae4ec7a5aeb8ad95d094cc0747aff73e6e5))
* **deps:** update dependency conventional-recommended-bump to v6.0.11 ([e4d827f](https://github.com/CrowdStrike/monorepo-next/commit/e4d827f328e027f7784743c097511dffa2f32c87))

### [2.3.1](https://github.com/CrowdStrike/monorepo-next/compare/v2.3.0...v2.3.1) (2020-10-02)


### Bug Fixes

* remove unused `sinceBranch` arg ([01b9986](https://github.com/CrowdStrike/monorepo-next/commit/01b9986ad83df9c2b99dd482643780a73981a970))

## [2.3.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.2.0...v2.3.0) (2020-10-01)


### Features

* implement `sinceBranch` ([47f8928](https://github.com/CrowdStrike/monorepo-next/commit/47f89284b4dcfd34f6c6cf876b73eb4b82464358))

## [2.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.1.0...v2.2.0) (2020-10-01)


### Features

* allow caching `fromCommit` too ([7085beb](https://github.com/CrowdStrike/monorepo-next/commit/7085beb2d2a2ba1add3c9e3f5b6fee18b0bf23a5))

## [2.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v2.0.2...v2.1.0) (2020-09-28)


### Features

* allow caching git operations ([0342b75](https://github.com/CrowdStrike/monorepo-next/commit/0342b754b90b1938cd98a9fb9921e462a58d41e5))

### [2.0.2](https://github.com/CrowdStrike/monorepo-next/compare/v2.0.1...v2.0.2) (2020-09-28)


### Bug Fixes

* move `getCurrentCommit` to tests ([22c576a](https://github.com/CrowdStrike/monorepo-next/commit/22c576a44ab58c1b4ff32246e459c6e2a9939e08))
* remove unnecessary `getCurrentCommit` call ([6598710](https://github.com/CrowdStrike/monorepo-next/commit/65987103fdb08dd751478b15b7e60d8e14ac7b47))

### [2.0.1](https://github.com/CrowdStrike/monorepo-next/compare/v2.0.0...v2.0.1) (2020-09-25)


### Bug Fixes

* include dot in extension check ([3b5aa1b](https://github.com/CrowdStrike/monorepo-next/commit/3b5aa1b34c5372ac50f51b6015d6c9619a1796e4))

## [2.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v1.1.0...v2.0.0) (2020-09-25)


### ⚠ BREAKING CHANGES

* `ext` string is now `exts` array of strings

### Features

* allow multiple extensions at once ([42a8078](https://github.com/CrowdStrike/monorepo-next/commit/42a8078d7eb01423f4442f2fb31dbe9adf8356af))

## [1.1.0](https://github.com/CrowdStrike/monorepo-next/compare/v1.0.0...v1.1.0) (2020-09-25)


### Features

* allow calculating diff in reverse order ([df39504](https://github.com/CrowdStrike/monorepo-next/commit/df395045d7313b67e2357ec60598910b3afc3ff8))

## [1.0.0](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.47...v1.0.0) (2020-09-25)


### ⚠ BREAKING CHANGES

* bump min node to 10

### Features

* accept `fromCommit` from `changed` and `changedFiles` ([f1f8bb4](https://github.com/CrowdStrike/monorepo-next/commit/f1f8bb49b543e51eee5e740ecfa9d3541eff155b))
* allow `buildChangeGraph` to take a `fromCommit` ([2a6dc32](https://github.com/CrowdStrike/monorepo-next/commit/2a6dc321f7f5dbba8e85e13cad7540cecdc671e7))


### Bug Fixes

* **deps:** update dependency conventional-changelog to v3.1.23 ([05a7a5e](https://github.com/CrowdStrike/monorepo-next/commit/05a7a5e2ab844da7958b91c3715cc052598dfb86))
* **deps:** update dependency conventional-recommended-bump to v6.0.10 ([a1c90dc](https://github.com/CrowdStrike/monorepo-next/commit/a1c90dce75c3bbd29e98871b161f7593a79d09b0))
* **deps:** update dependency execa to v4 ([c144682](https://github.com/CrowdStrike/monorepo-next/commit/c144682f395d4d3e4958a04415d035062fae09e2))
* **deps:** update dependency standard-version to v8 [security] ([14f9427](https://github.com/CrowdStrike/monorepo-next/commit/14f942788797f7952d44d1ccf199f69b9b1925ca))
* **deps:** update dependency standard-version to v8.0.2 ([de4fd9e](https://github.com/CrowdStrike/monorepo-next/commit/de4fd9e2c2e824144b21497ee2707760a37b6527))
* **deps:** update dependency standard-version to v9 ([14bf302](https://github.com/CrowdStrike/monorepo-next/commit/14bf30227353f8ff0dec6d0015268317b2814381))
* **deps:** update dependency yargs to v16 ([bcaa60c](https://github.com/CrowdStrike/monorepo-next/commit/bcaa60c19c8a4d817b51d8abd183fa9a2346cd95))


* track `standard-node-template` ([3c11090](https://github.com/CrowdStrike/monorepo-next/commit/3c110909fe3c7c5c131a3ef75a9f6ba4ffc4aa65))

### [0.2.47](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.46...v0.2.47) (2020-07-20)


### Features

* **#114:** support wildcard versions ([#115](https://github.com/CrowdStrike/monorepo-next/issues/115)) ([86c5499](https://github.com/CrowdStrike/monorepo-next/commit/86c54993cf68c70301bf27b2964325abc77ef97f)), closes [#114](https://github.com/CrowdStrike/monorepo-next/issues/114) [#114](https://github.com/CrowdStrike/monorepo-next/issues/114)

### [0.2.46](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.45...v0.2.46) (2020-05-03)


### Bug Fixes

* fix regression with `&&` in lifecycle script ([17b06ea](https://github.com/CrowdStrike/monorepo-next/commit/17b06ea7daf846f32f1c7eba252a99b2f786e851))

### [0.2.45](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.44...v0.2.45) (2020-05-03)


### Bug Fixes

* retain empty version strings in `buildDAG` ([554f02f](https://github.com/CrowdStrike/monorepo-next/commit/554f02ff21f95b3dd4c308ab10a320e3f7be8561))

### [0.2.44](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.43...v0.2.44) (2020-04-30)


### Bug Fixes

* handle mulitple root commits when package is new ([faafaf4](https://github.com/CrowdStrike/monorepo-next/commit/faafaf40f52eda557f68f63150ba16573eeee53f))

### [0.2.43](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.42...v0.2.43) (2020-04-29)


### Bug Fixes

* ignore empty package dirs ([506112d](https://github.com/CrowdStrike/monorepo-next/commit/506112dfa3782285120bcf7d80df1411334b49c6))

### [0.2.42](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.41...v0.2.42) (2020-04-28)


### Features

* support new packages without an existing version tag ([c44e744](https://github.com/CrowdStrike/monorepo-next/commit/c44e74495cde0b332c990a0e27d803d55f50748b))

### [0.2.41](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.40...v0.2.41) (2020-04-28)


### Bug Fixes

* `getCurrentAtTag` => `getCommitAtTag` typo ([9e59968](https://github.com/CrowdStrike/monorepo-next/commit/9e5996897b1197a9eb200e8ca12b49edcf4d48e8))
* extract some git operations to reusable functions ([00c7809](https://github.com/CrowdStrike/monorepo-next/commit/00c7809098dee4c6b99633918e7bf635b1f33444))

### [0.2.40](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.39...v0.2.40) (2020-04-28)


### Bug Fixes

* only use `execa` for safety ([0275b6b](https://github.com/CrowdStrike/monorepo-next/commit/0275b6b34cd2871c989163585d0dcbd2df262686))

### [0.2.39](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.38...v0.2.39) (2020-04-01)


### Bug Fixes

* handle changelogs where only the dep changed ([1922c56](https://github.com/CrowdStrike/monorepo-next/commit/1922c568658093419c9ae1bf29b5c1293ea97df0))

### [0.2.38](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.37...v0.2.38) (2020-03-27)


### Features

* allow generating changelog for multiple versions ([2bd8580](https://github.com/CrowdStrike/monorepo-next/commit/2bd8580f65cadca4aab0e0f2ef4f55c154058614))

### [0.2.37](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.36...v0.2.37) (2020-03-27)


### Bug Fixes

* uses previous version if no changes ([8d7e968](https://github.com/CrowdStrike/monorepo-next/commit/8d7e9683f2e4ffe020a1c7198800978db78f30a3))

### [0.2.36](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.35...v0.2.36) (2020-02-21)


### Features

* add `getChangelog` ([3b7cda9](https://github.com/CrowdStrike/monorepo-next/commit/3b7cda9f3f91c44107a62ffc60446d5216aa704d))


### Bug Fixes

* prevent circular requires ([fa8378c](https://github.com/CrowdStrike/monorepo-next/commit/fa8378c16b360babb76fc8be8d3e92095f0ba2fb))

### [0.2.35](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.34...v0.2.35) (2020-01-28)


### Bug Fixes

* really add all ([ea8d50d](https://github.com/CrowdStrike/monorepo-next/commit/ea8d50d04c1f35f365cf4f4037622adcc707a48e))

### [0.2.34](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.33...v0.2.34) (2020-01-28)


### Features

* handle `standard-version` lifecycle scripts if present ([5151258](https://github.com/CrowdStrike/monorepo-next/commit/51512587cfaee27bc51c0e9e92863bcad1997a31))

### [0.2.33](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.32...v0.2.33) (2020-01-23)


### Features

* track dirty changes on top of committed ([24674e6](https://github.com/CrowdStrike/monorepo-next/commit/24674e6ad32fd34842b8b13dcbdfa2ee14a002b7))

### [0.2.32](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.31...v0.2.32) (2020-01-23)


### Bug Fixes

* convert to spawn to allow strings in path ([43260ab](https://github.com/CrowdStrike/monorepo-next/commit/43260ab3dc5a97e8b0604a0c30821acfe7dee345))

### [0.2.31](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.30...v0.2.31) (2020-01-22)


### Bug Fixes

* allow running with defaults ([291a67a](https://github.com/CrowdStrike/monorepo-next/commit/291a67a95f28b4a422a09b2eea8236409b8de443))

### [0.2.30](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.29...v0.2.30) (2020-01-22)


### Features

* match `standard-version` release commit message ([2f4ba64](https://github.com/CrowdStrike/monorepo-next/commit/2f4ba64a2b4d501e351fa81f32d088ff3057a8ac))

### [0.2.29](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.28...v0.2.29) (2020-01-22)


### Bug Fixes

* remove already applied options ([b651720](https://github.com/CrowdStrike/monorepo-next/commit/b651720530b34623f57a5a1d49167cd2302d5e38))

### [0.2.28](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.27...v0.2.28) (2020-01-22)


### Features

* use sensible default for cwd ([7655f09](https://github.com/CrowdStrike/monorepo-next/commit/7655f098e1de7af30012e44617f5db7418656509))

### [0.2.27](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.26...v0.2.27) (2020-01-15)


### Bug Fixes

* `non-fast-forward` error message ([6dbf7f4](https://github.com/CrowdStrike/monorepo-next/commit/6dbf7f42174c43df2348cd4f3e90a1c005ffc62b))

### [0.2.26](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.25...v0.2.26) (2020-01-15)


### Features

* stop swallowing error codes ([bef73b8](https://github.com/CrowdStrike/monorepo-next/commit/bef73b8942482756fd00fdc580ab094fa7e7ff02))

### [0.2.25](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.24...v0.2.25) (2020-01-15)


### Bug Fixes

* support non-atomic remotes ([440c03c](https://github.com/CrowdStrike/monorepo-next/commit/440c03cd74a446e5e0a9cd9ab21d397567b5ffd1))

### [0.2.24](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.23...v0.2.24) (2020-01-13)


### Bug Fixes

* `bumpFiles` ([0e82614](https://github.com/CrowdStrike/monorepo-next/commit/0e826146535e6b742f96265822dab4d3f4ff3a52))
* update standard-version ([ac3c005](https://github.com/CrowdStrike/monorepo-next/commit/ac3c0051d86390ed7db9f160a3802d5440e487df))

### [0.2.23](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.22...v0.2.23) (2020-01-13)


### Bug Fixes

* remove npx call ([67167e5](https://github.com/CrowdStrike/monorepo-next/commit/67167e5f935a7998ca73f1d56cc42160ac388259))

### [0.2.22](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.21...v0.2.22) (2020-01-13)


### Features

* forward `packageFiles` and `bumpFiles` options ([6d2c604](https://github.com/CrowdStrike/monorepo-next/commit/6d2c6040ad02e75b1b0995b6a4a6290e4cf42cee))

### [0.2.21](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.20...v0.2.21) (2020-01-13)


### Features

* support pnpm workspaces ([2ab8bfe](https://github.com/CrowdStrike/monorepo-next/commit/2ab8bfe9f8d62c09bf9f28c7ed8d7885248e1965))

### [0.2.20](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.19...v0.2.20) (2020-01-13)


### Bug Fixes

* pave the way for other monorepo support (pnpm, lerna) ([a8c9a54](https://github.com/CrowdStrike/monorepo-next/commit/a8c9a5450f146bf7cb16ca341e8745ab3e203cc3))

### [0.2.19](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.18...v0.2.19) (2020-01-06)

### [0.2.18](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.17...v0.2.18) (2020-01-06)

### [0.2.17](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.16...v0.2.17) (2019-12-11)


### Bug Fixes

* treat `optionalDependencies` like other dependency types ([ce79937](https://github.com/CrowdStrike/monorepo-next/commit/ce799378fcf38d2fd74cedc5d11fd4fc4d2e40ce))

### [0.2.16](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.15...v0.2.16) (2019-12-11)


### Bug Fixes

* private projects should track out of range too ([af5afce](https://github.com/CrowdStrike/monorepo-next/commit/af5afcef2505b19e2c6acaf4fc1d5ab3ebe05c49))

### [0.2.15](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.14...v0.2.15) (2019-12-11)

### [0.2.14](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.13...v0.2.14) (2019-12-11)


### Bug Fixes

* track newly out of range ([a306115](https://github.com/CrowdStrike/monorepo-next/commit/a3061154fda37b3c4ec8dbfe65a08dff0103595a))

### [0.2.13](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.12...v0.2.13) (2019-12-11)


### Bug Fixes

* fix `shouldInheritGreaterReleaseType` when no changes ([6d598eb](https://github.com/CrowdStrike/monorepo-next/commit/6d598ebd73cc3a916397a6a1e0c7e827b2ae992c))

### [0.2.12](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.11...v0.2.12) (2019-11-19)


### Bug Fixes

* **deps:** update dependency standard-version to v7.0.1 ([d700319](https://github.com/CrowdStrike/monorepo-next/commit/d7003197fb91baed6e5fe202360f16b0ddfe5977))

### [0.2.11](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.10...v0.2.11) (2019-11-18)


### Bug Fixes

* **deps:** update dependency conventional-recommended-bump to v6.0.5 ([2c62f77](https://github.com/CrowdStrike/monorepo-next/commit/2c62f777ca3d81b52fc0fd9cb8be78f80cfb053d))

### [0.2.10](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.9...v0.2.10) (2019-11-18)


### Bug Fixes

* **deps:** update dependency yargs to v15 ([cc8fc4d](https://github.com/CrowdStrike/monorepo-next/commit/cc8fc4d3408156c708c58a53f543eba2df3b58e5))

### [0.2.9](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.8...v0.2.9) (2019-11-11)


### Bug Fixes

* **deps:** update dependency conventional-recommended-bump to v6.0.4 ([89fc33c](https://github.com/CrowdStrike/monorepo-next/commit/89fc33c85497a543e76adc486aaf7d745dcdd76f))

### [0.2.8](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.7...v0.2.8) (2019-11-04)


### Bug Fixes

* **deps:** update dependency conventional-recommended-bump to v6.0.2 ([5d5f24d](https://github.com/CrowdStrike/monorepo-next/commit/5d5f24d))

### [0.2.7](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.6...v0.2.7) (2019-11-04)


### Bug Fixes

* **deps:** update dependency execa to v3 ([e725fab](https://github.com/CrowdStrike/monorepo-next/commit/e725fab))

### [0.2.6](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.5...v0.2.6) (2019-09-27)


### Features

* pass through scripts option ([38fb781](https://github.com/CrowdStrike/monorepo-next/commit/38fb781))

### [0.2.5](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.4...v0.2.5) (2019-09-24)

### [0.2.4](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.3...v0.2.4) (2019-09-21)


### Bug Fixes

* fix json formatting on Windows ([317c412](https://github.com/CrowdStrike/monorepo-next/commit/317c412))

### [0.2.3](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.2...v0.2.3) (2019-09-21)


### Bug Fixes

* create annotated tag ([ed5f970](https://github.com/CrowdStrike/monorepo-next/commit/ed5f970))

### [0.2.2](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.1...v0.2.2) (2019-09-15)


### Bug Fixes

* ignore unchanged packages ([48d3b75](https://github.com/CrowdStrike/monorepo-next/commit/48d3b75))

### [0.2.1](https://github.com/CrowdStrike/monorepo-next/compare/v0.2.0...v0.2.1) (2019-09-15)

## [0.2.0](https://github.com/CrowdStrike/monorepo-next/compare/v0.1.2...v0.2.0) (2019-09-15)


### Features

* release options ([918fc8f](https://github.com/CrowdStrike/monorepo-next/commit/918fc8f))

### [0.1.2](https://github.com/CrowdStrike/monorepo-next/compare/v0.1.1...v0.1.2) (2019-09-12)


### Bug Fixes

* fix non-package choice naming ([9789ab2](https://github.com/CrowdStrike/monorepo-next/commit/9789ab2))

### [0.1.1](https://github.com/CrowdStrike/monorepo-next/compare/v0.1.0...v0.1.1) (2019-09-12)


### Bug Fixes

* add travis file ([c8389a2](https://github.com/CrowdStrike/monorepo-next/commit/c8389a2))
* update commitlint ([7bfebde](https://github.com/CrowdStrike/monorepo-next/commit/7bfebde))
