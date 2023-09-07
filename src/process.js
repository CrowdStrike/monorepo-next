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

    options.stdio = 'pipe';
  }

  return {
    args: [command, args, _options].filter(Boolean),
    silent,
    dryRun,
  };
}

function bind(_execa) {
  return function execa() {
    let {
      args,
      silent,
      dryRun,
    } = prepareArgs(...arguments);

    if (!dryRun) {
      let ps = _execa().apply(this, args);

      if (!silent) {
        ps.stdout.pipe(process.stdout);
        ps.stderr.pipe(process.stderr);
      }

      return ps;
    }
  };
}

const execa = bind(() => _execa);
execa.command = bind(() => _execa.command);

module.exports = {
  execa,
};
