'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const { trackNewVersion } = require('../src/version');
const sinon = require('sinon');

const name = 'test-package';

describe(function() {
  let warn;

  beforeEach(function() {
    warn = sinon.stub(console, 'warn');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe(trackNewVersion, function() {
    it('warns when ||', function() {
      let oldRange = '>= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0';
      let newRange = oldRange;
      let newVersion = '5.0.0';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('^5.0.0');

      let warning = 'Current range has an OR (test-package >= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0) and is too hard to increment, falling back to ^';

      expect(warn.withArgs(warning)).to.be.calledOnce;
    });

    it('tracks major with ^', function() {
      let oldRange = '^1.0.0';
      let newRange = oldRange;
      let newVersion = '2.0.0';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('^2.0.0');
    });

    it('tracks major with ~', function() {
      let oldRange = '~1.0.0';
      let newRange = oldRange;
      let newVersion = '2.0.0';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('~2.0.0');
    });

    it('tracks minor with ~', function() {
      let oldRange = '~1.0.0';
      let newRange = oldRange;
      let newVersion = '1.1.0';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('~1.1.0');
    });

    it('tracks minor with ^', function() {
      let oldRange = '^1.0.0';
      let newRange = oldRange;
      let newVersion = '1.1.0';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('^1.1.0');
    });

    it('tracks pinned', function() {
      let oldRange = '1.0.0';
      let newRange = oldRange;
      let newVersion = '1.0.1';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('1.0.1');
    });

    it('tracks wildcards (by not doing anything)', function() {
      let oldRange = '*';
      let newRange = oldRange;
      let newVersion = '1.0.1';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('*');
    });

    it('uses ~ on major version zero with ^', function() {
      let oldRange = '^0.0.0';
      let newRange = oldRange;
      let newVersion = '0.0.1';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('~0.0.1');
    });

    it('warns with old range', function() {
      let oldRange = '>= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0 || 4.0.0-detached';
      let newRange = '>= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0';
      let newVersion = '5.0.0';

      newRange = trackNewVersion({ name, oldRange, newRange, newVersion });

      expect(newRange).to.equal('^5.0.0');

      let warning = 'Current range has an OR (test-package >= 1.0.0 < 2.0.0 || >= 3.0.0 < 4.0.0 || 4.0.0-detached) and is too hard to increment, falling back to ^';

      expect(warn.withArgs(warning)).to.be.calledOnce;
    });
  });
});
