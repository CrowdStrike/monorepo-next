'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const execa = require('execa');
const path = require('path');

describe(function() {
  it('assert CLI loads', async function() {
    let { next } = require('../package').bin;

    let cwd = path.resolve(__dirname, '..');

    let { stdout } = await execa(next, ['--help'], {
      cwd,
    });

    expect(stdout).to.include('next.js [command]');
  });
});
