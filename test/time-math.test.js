'use strict';

// Unit tests for Worldtime's time/zone math. Run with `node --test` (or
// `npm test`). No dependencies — just Node's built-in test runner. The helpers
// live in ../worldtime-data.js, which exports them under CommonJS when run in
// Node while staying a plain browser <script> otherwise.
//
// All timezone assertions use fixed instants in 2026 chosen to sit well clear of
// any DST transition, so they lean only on the well-established IANA rules that
// ship with Node's ICU — no dependence on the machine's local timezone or clock.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  TIMEZONE_DATA,
  DEFAULT_TIMEZONES,
  canonicalTz,
  dataByKey,
  keySlug,
  formatTime,
  dayNumberInZone,
  zoneOffsetMinutes,
  zoneAbbr,
  isDaytime,
} = require('../worldtime-data.js');

// Mid-winter / mid-summer (northern hemisphere) reference instants.
const JAN = new Date('2026-01-15T12:00:00Z');
const JUL = new Date('2026-07-15T12:00:00Z');

describe('formatTime', () => {
  test('24-hour formatting pads to two digits', () => {
    assert.equal(formatTime(9, 5, 3, true, true), '09:05:03');
    assert.equal(formatTime(0, 0, 0, true, true), '00:00:00');
    assert.equal(formatTime(23, 59, 59, true, true), '23:59:59');
  });

  test('24-hour without seconds omits the seconds field', () => {
    assert.equal(formatTime(9, 5, 3, true, false), '09:05');
    assert.equal(formatTime(13, 7, 45, true, false), '13:07');
  });

  test('12-hour midnight and noon use 12, not 0', () => {
    assert.equal(formatTime(0, 0, 0, false, false), '12:00 AM');
    assert.equal(formatTime(0, 30, 0, false, false), '12:30 AM');
    assert.equal(formatTime(12, 0, 0, false, false), '12:00 PM');
    assert.equal(formatTime(12, 30, 0, false, false), '12:30 PM');
  });

  test('12-hour AM/PM boundaries', () => {
    assert.equal(formatTime(11, 59, 0, false, false), '11:59 AM');
    assert.equal(formatTime(13, 0, 0, false, false), '01:00 PM');
    assert.equal(formatTime(23, 59, 59, false, true), '11:59:59 PM');
    assert.equal(formatTime(1, 5, 9, false, true), '01:05:09 AM');
  });

  // Documents current behaviour: the 12-hour clock zero-pads the hour (via
  // pad(h12)), so 1 PM renders as "01:00 PM", not "1:00 PM". Both cards line up
  // to the same width as a result. Kept as an explicit test so any future change
  // to this convention is a deliberate, visible decision.
  test('12-hour hour is zero-padded to two digits', () => {
    assert.equal(formatTime(1, 0, 0, false, false), '01:00 AM');
    assert.equal(formatTime(9, 30, 0, false, false), '09:30 AM');
  });

  test('showSeconds defaults to true when omitted', () => {
    assert.equal(formatTime(1, 2, 3, true), '01:02:03');
  });
});

describe('keySlug', () => {
  test('replaces runs of non-alphanumerics with a single underscore', () => {
    assert.equal(keySlug('UTC'), 'UTC');
    assert.equal(keySlug('America/New_York'), 'America_New_York');
    assert.equal(keySlug('America/New_York|Boston'), 'America_New_York_Boston');
  });

  test('is collision-free across the whole catalog', () => {
    const slugs = TIMEZONE_DATA.map((d) => keySlug(d.key));
    assert.equal(new Set(slugs).size, slugs.length);
  });
});

describe('canonicalTz', () => {
  test('leaves already-canonical zones untouched', () => {
    assert.equal(canonicalTz('UTC'), 'UTC');
    assert.equal(canonicalTz('America/New_York'), 'America/New_York');
  });

  test('falls back to the input for an unsupported zone', () => {
    assert.equal(canonicalTz('Not/AZone'), 'Not/AZone');
  });
});

describe('dataByKey', () => {
  test('looks up plain IANA zones', () => {
    assert.equal(dataByKey('America/New_York').city, 'New York');
    assert.equal(dataByKey('UTC').city, 'UTC');
  });

  test('looks up alias-city keys distinctly from their base zone', () => {
    assert.equal(dataByKey('America/New_York|Boston').city, 'Boston');
    assert.equal(dataByKey('America/New_York|Boston').id, 'America/New_York');
  });

  test('returns undefined for an unknown key', () => {
    assert.equal(dataByKey('No/Such_Zone'), undefined);
  });

  test('every default timezone resolves to a catalog entry', () => {
    for (const key of DEFAULT_TIMEZONES) {
      assert.ok(dataByKey(key), `missing catalog entry for default "${key}"`);
    }
  });
});

describe('zoneOffsetMinutes', () => {
  test('UTC is always zero', () => {
    assert.equal(zoneOffsetMinutes('UTC', JAN), 0);
    assert.equal(zoneOffsetMinutes('UTC', JUL), 0);
  });

  test('non-DST zones are stable year-round', () => {
    // India +5:30, no DST.
    assert.equal(zoneOffsetMinutes('Asia/Kolkata', JAN), 330);
    assert.equal(zoneOffsetMinutes('Asia/Kolkata', JUL), 330);
    // Arizona stays on MST (no DST) even though it looks like a US zone.
    assert.equal(zoneOffsetMinutes('America/Phoenix', JAN), -420);
    assert.equal(zoneOffsetMinutes('America/Phoenix', JUL), -420);
  });

  test('handles fractional-hour offsets', () => {
    // Nepal +5:45.
    assert.equal(zoneOffsetMinutes('Asia/Kathmandu', JAN), 345);
    assert.equal(zoneOffsetMinutes('Asia/Kathmandu', JUL), 345);
  });

  test('northern-hemisphere DST springs forward in summer', () => {
    assert.equal(zoneOffsetMinutes('America/New_York', JAN), -300); // EST
    assert.equal(zoneOffsetMinutes('America/New_York', JUL), -240); // EDT
    assert.equal(zoneOffsetMinutes('America/Los_Angeles', JAN), -480); // PST
    assert.equal(zoneOffsetMinutes('America/Los_Angeles', JUL), -420); // PDT
    assert.equal(zoneOffsetMinutes('Europe/London', JAN), 0);   // GMT
    assert.equal(zoneOffsetMinutes('Europe/London', JUL), 60);  // BST
  });

  test('southern-hemisphere DST is reversed (summer in January)', () => {
    assert.equal(zoneOffsetMinutes('Australia/Sydney', JAN), 660); // AEDT (+11)
    assert.equal(zoneOffsetMinutes('Australia/Sydney', JUL), 600); // AEST (+10)
  });
});

describe('dayNumberInZone', () => {
  test('matches the naive UTC day count for a UTC zone', () => {
    const expected = Math.round(Date.UTC(2026, 0, 15) / 86400000);
    assert.equal(dayNumberInZone('UTC', JAN), expected);
  });

  test('rolls forward across the international date line', () => {
    // 23:30 UTC — already tomorrow in Tokyo (+9), still today in UTC.
    const lateUtc = new Date('2026-01-15T23:30:00Z');
    assert.equal(
      dayNumberInZone('Asia/Tokyo', lateUtc) - dayNumberInZone('UTC', lateUtc),
      1
    );
  });

  test('rolls back for far-western zones', () => {
    // 00:30 UTC — still yesterday in Honolulu (-10).
    const earlyUtc = new Date('2026-01-15T00:30:00Z');
    assert.equal(
      dayNumberInZone('Pacific/Honolulu', earlyUtc) - dayNumberInZone('UTC', earlyUtc),
      -1
    );
  });
});

describe('zoneAbbr', () => {
  test('picks daylight vs standard names for northern DST zones', () => {
    const ny = { abbr: 'EST', dst: 'EDT' };
    assert.equal(zoneAbbr('America/New_York', ny, JAN), 'EST');
    assert.equal(zoneAbbr('America/New_York', ny, JUL), 'EDT');

    const la = { abbr: 'PST', dst: 'PDT' };
    assert.equal(zoneAbbr('America/Los_Angeles', la, JAN), 'PST');
    assert.equal(zoneAbbr('America/Los_Angeles', la, JUL), 'PDT');

    const paris = { abbr: 'CET', dst: 'CEST' };
    assert.equal(zoneAbbr('Europe/Paris', paris, JAN), 'CET');
    assert.equal(zoneAbbr('Europe/Paris', paris, JUL), 'CEST');

    const london = { abbr: 'GMT', dst: 'BST' };
    assert.equal(zoneAbbr('Europe/London', london, JAN), 'GMT');
    assert.equal(zoneAbbr('Europe/London', london, JUL), 'BST');
  });

  test('reverses daylight/standard for southern-hemisphere zones', () => {
    const sydney = { abbr: 'AEST', dst: 'AEDT' };
    assert.equal(zoneAbbr('Australia/Sydney', sydney, JAN), 'AEDT'); // summer
    assert.equal(zoneAbbr('Australia/Sydney', sydney, JUL), 'AEST'); // winter
  });

  test('returns the standard name for zones without DST', () => {
    assert.equal(zoneAbbr('Asia/Kolkata', { abbr: 'IST' }, JAN), 'IST');
    assert.equal(zoneAbbr('Asia/Kolkata', { abbr: 'IST' }, JUL), 'IST');
    assert.equal(zoneAbbr('America/Phoenix', { abbr: 'MST' }, JAN), 'MST');
    assert.equal(zoneAbbr('America/Phoenix', { abbr: 'MST' }, JUL), 'MST');
  });
});

describe('isDaytime', () => {
  test('is true from 06:00 up to (but not including) 18:00', () => {
    assert.equal(isDaytime(6), true);
    assert.equal(isDaytime(12), true);
    assert.equal(isDaytime(17), true);
  });

  test('is false overnight', () => {
    assert.equal(isDaytime(5), false);
    assert.equal(isDaytime(18), false);
    assert.equal(isDaytime(23), false);
    assert.equal(isDaytime(0), false);
  });
});
