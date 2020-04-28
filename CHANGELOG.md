# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
