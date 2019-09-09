'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { trackNewVersion } = require('../src/version');
const sinon = require('sinon');

const name = 'test-package';

describe(function() {
  let sandbox;
  let warn;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    warn = sandbox.stub(console, 'warn');
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(trackNewVersion, function() {
    it('doesn\'t change on *', function() {
      let oldRange = '*';
      let newVersion = '2.0.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('*');
    });

    it('warns when ||', function() {
      let oldRange = '>= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0';
      let newVersion = '5.0.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('^5.0.0');

      let warning = 'Current range has an OR (test-package >= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0) and is too hard to increment, falling back to ^';

      expect(warn.withArgs(warning)).to.be.calledOnce;
    });

    it('tracks major with ^', function() {
      let oldRange = '^1.0.0';
      let newVersion = '2.0.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('^2.0.0');
    });

    it('tracks major with ~', function() {
      let oldRange = '~1.0.0';
      let newVersion = '2.0.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('~2.0.0');
    });

    it('tracks minor with ~', function() {
      let oldRange = '~1.0.0';
      let newVersion = '1.1.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('~1.1.0');
    });

    it('doesn\'t change when minor with ^', function() {
      let oldRange = '^1.0.0';
      let newVersion = '1.1.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('^1.0.0');
    });

    it('tracks pinned', function() {
      let oldRange = '1.0.0';
      let newVersion = '1.0.1';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('1.0.1');
    });

    it('uses ~ on major version zero with ^', function() {
      let oldRange = '^0.0.0';
      let newVersion = '0.0.1';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('~0.0.1');
    });

    it('detaches first', function() {
      let oldRange = '^1.0.0 || 1.0.0-detached';
      let newVersion = '2.0.0';

      let newRange = trackNewVersion(name, oldRange, newVersion);

      expect(newRange).to.equal('^2.0.0');
    });
  });
});
