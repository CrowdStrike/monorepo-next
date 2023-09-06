'use strict';

const _execa = require('execa');

function prettyPrintArgs(args) {
  return args?.map(arg => arg.toString().includes(' ') ? `'${arg}'` : arg);
}

function logArgs(command, args, options) {
  console.log(...[command, prettyPrintArgs(args), options].filter(Boolean));
}

function prepareArgs(command, args, options = {}) {
  if (!Array.isArray(args)) {
    options = args;
    args = null;
  }

  let {
    silent,
    dryRun,
    ..._options
  } = options;

  if (!silent) {
    logArgs(command, args, _options);
  }

  return {
    args: [command, args, _options].filter(Boolean),
    dryRun,
  };
}

function bind(_execa) {
  return function execa() {
    let { args, dryRun } = prepareArgs(...arguments);

    if (!dryRun) {
      return _execa().apply(this, args);
    }
  };
}

const execa = bind(() => _execa);
execa.command = bind(() => _execa.command);

module.exports = {
  execa,
};
