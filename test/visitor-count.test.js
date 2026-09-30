'use strict';

// Unit tests for the GoatCounter visitor footnote's paths. Every page records its
// visits under visitPath(), and the footnote sums the counts of COUNTED_PAGES, so
// the two must line up: a page missing from COUNTED_PAGES would be recorded but
// never shown in the total. Run with `node --test` (or `npm test`).

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { COUNTED_PAGES, visitPath } = require('../worldtime-data.js');

describe('visitPath', () => {
  test('folds index.html into its directory', () => {
    assert.equal(visitPath('/worldtime/index.html'), '/worldtime/');
    assert.equal(visitPath('/worldtime/'), '/worldtime/');
    assert.equal(visitPath('/index.html'), '/');
  });

  test('leaves other pages under their own path', () => {
    assert.equal(visitPath('/worldtime/explore.html'), '/worldtime/explore.html');
  });
});

describe('COUNTED_PAGES', () => {
  test('covers every page in the repo, so each one adds to the shared total', () => {
    const root = path.join(__dirname, '..');
    const summed = COUNTED_PAGES.map(page => '/app/' + page);
    fs.readdirSync(root).filter(f => f.endsWith('.html')).forEach(file => {
      assert.ok(summed.includes(visitPath('/app/' + file)),
        file + ' is recorded as its own page but missing from COUNTED_PAGES');
    });
  });
});
