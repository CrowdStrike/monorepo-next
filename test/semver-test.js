'use strict';

const { describe, it } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const {
  isWorkspaceProtocol,
  extractRange,
  isWorkspaceProtocolReplacementVersion,
  satisfies,
  isValidRange,
} = require('../src/semver');

describe(function() {
  describe(isWorkspaceProtocol, function() {
    it('detects workspace protocol ranges', function() {
      expect(isWorkspaceProtocol('workspace:*')).to.equal(true);
      expect(isWorkspaceProtocol('workspace:^1.0.0')).to.equal(true);
      expect(isWorkspaceProtocol('workspace:~1.2.3')).to.equal(true);
      expect(isWorkspaceProtocol('workspace:^')).to.equal(true);
      expect(isWorkspaceProtocol('workspace:~')).to.equal(true);
    });

    it('returns false for regular semver ranges', function() {
      expect(isWorkspaceProtocol('^1.0.0')).to.equal(false);
      expect(isWorkspaceProtocol('~1.2.3')).to.equal(false);
      expect(isWorkspaceProtocol('*')).to.equal(false);
      expect(isWorkspaceProtocol('1.0.0')).to.equal(false);
    });
  });

  describe(extractRange, function() {
    it('extracts semver from workspace protocol', function() {
      expect(extractRange('workspace:^1.0.0')).to.equal('^1.0.0');
      expect(extractRange('workspace:~1.2.3')).to.equal('~1.2.3');
      expect(extractRange('workspace:1.0.0')).to.equal('1.0.0');
      expect(extractRange('workspace:*')).to.equal('*');
    });

    it('returns regular semver unchanged', function() {
      expect(extractRange('^1.0.0')).to.equal('^1.0.0');
      expect(extractRange('~1.2.3')).to.equal('~1.2.3');
      expect(extractRange('*')).to.equal('*');
    });

    it('handles special workspace shortcuts', function() {
      expect(extractRange('workspace:')).to.equal('');
      expect(extractRange('workspace:^')).to.equal('^');
      expect(extractRange('workspace:~')).to.equal('~');
    });
  });

  describe(isWorkspaceProtocolReplacementVersion, function() {
    it('detects replacement version shortcuts', function() {
      expect(isWorkspaceProtocolReplacementVersion('^')).to.equal(true);
      expect(isWorkspaceProtocolReplacementVersion('~')).to.equal(true);
    });

    it('returns false for non-replacement versions', function() {
      expect(isWorkspaceProtocolReplacementVersion('*')).to.equal(false);
      expect(isWorkspaceProtocolReplacementVersion('')).to.equal(false);
      expect(isWorkspaceProtocolReplacementVersion('^1.0.0')).to.equal(false);
      expect(isWorkspaceProtocolReplacementVersion('~1.2.3')).to.equal(false);
      expect(isWorkspaceProtocolReplacementVersion('1.0.0')).to.equal(false);
    });
  });

  describe(satisfies, function() {
    it('handles regular semver ranges', function() {
      expect(satisfies('1.5.0', '^1.0.0')).to.equal(true);
      expect(satisfies('2.0.0', '^1.0.0')).to.equal(false);
      expect(satisfies('1.2.4', '~1.2.3')).to.equal(true);
      expect(satisfies('1.3.0', '~1.2.3')).to.equal(false);
    });

    it('handles workspace protocol ranges transparently', function() {
      expect(satisfies('1.5.0', 'workspace:^1.0.0')).to.equal(true);
      expect(satisfies('2.0.0', 'workspace:^1.0.0')).to.equal(false);
      expect(satisfies('1.2.4', 'workspace:~1.2.3')).to.equal(true);
      expect(satisfies('1.3.0', 'workspace:~1.2.3')).to.equal(false);
    });

    it('handles special workspace shortcuts', function() {
      expect(satisfies('1.0.0', 'workspace:*')).to.equal(true);
      expect(satisfies('999.999.999', 'workspace:*')).to.equal(true);
      expect(satisfies('1.0.0', 'workspace:^')).to.equal(true);
      expect(satisfies('1.0.0', 'workspace:~')).to.equal(true);
    });
  });

  describe(isValidRange, function() {
    it('validates regular semver ranges', function() {
      expect(isValidRange('^1.0.0')).to.be.ok;
      expect(isValidRange('~1.2.3')).to.be.ok;
      expect(isValidRange('1.0.0')).to.be.ok;
      expect(isValidRange('*')).to.be.ok;
      expect(isValidRange('invalid')).to.be.null;
    });

    it('validates workspace protocol ranges transparently', function() {
      expect(isValidRange('workspace:^1.0.0')).to.be.ok;
      expect(isValidRange('workspace:~1.2.3')).to.be.ok;
      expect(isValidRange('workspace:1.0.0')).to.be.ok;
      expect(isValidRange('workspace:*')).to.be.ok;
      expect(isValidRange('workspace:^')).to.equal(true);
      expect(isValidRange('workspace:~')).to.equal(true);
      expect(isValidRange('workspace:invalid')).to.be.null;
    });

    it('rejects invalid inputs', function() {
      expect(isValidRange('invalid')).to.be.null;
    });
  });
});
