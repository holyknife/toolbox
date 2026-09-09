import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adToBs, bsToAd, clampPickerDate, daysInMonth, MAX_AD_DATE, MIN_AD_DATE, numericDate, todayInNepal } from '../app/tools/date-converter/convert';

// These independent pairs are published in the same package's reference-dates.json.
test('conversion matches published calendar reference dates in both directions', () => {
  const references = [
    [2000,1943,14], [2001,1944,13], [2010,1953,13], [2015,1958,13],
    [2025,1968,13], [2035,1978,14], [2045,1988,13], [2055,1998,14],
    [2065,2008,13], [2075,2018,14], [2082,2025,14], [2083,2026,14],
  ];
  for (const [bsYear,adYear,adDay] of references) {
    const bs = { year:bsYear, month:1, day:1 };
    const ad = { year:adYear, month:4, day:adDay };
    assert.deepEqual(bsToAd(bs), ad);
    assert.deepEqual(adToBs(ad), bs);
  }
});

test('every supported BS date round-trips and advances exactly one Gregorian day', () => {
  let previousTimestamp: number | null = null;
  for (let year = 2000; year <= 2100; year++) {
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= daysInMonth('BS', year, month); day++) {
        const bs = { year, month, day };
        const ad = bsToAd(bs);
        assert.deepEqual(adToBs(ad), bs);
        const timestamp = Date.UTC(ad.year, ad.month - 1, ad.day);
        if (previousTimestamp !== null) assert.equal(timestamp - previousTimestamp, 86400000);
        previousTimestamp = timestamp;
      }
    }
  }
});

test('boundaries are exact and invalid dates are rejected rather than rolled forward', () => {
  assert.deepEqual(adToBs(MIN_AD_DATE), { year:2000, month:1, day:1 });
  assert.deepEqual(adToBs(MAX_AD_DATE), { year:2100, month:12, day:daysInMonth('BS',2100,12) });
  assert.throws(() => adToBs({ year:1943, month:4, day:13 }));
  const next = new Date(Date.UTC(MAX_AD_DATE.year, MAX_AD_DATE.month - 1, MAX_AD_DATE.day + 1));
  assert.throws(() => adToBs({ year:next.getUTCFullYear(), month:next.getUTCMonth() + 1, day:next.getUTCDate() }));
  assert.throws(() => adToBs({ year:2025, month:2, day:29 }));
  assert.throws(() => bsToAd({ year:2080, month:13, day:1 }));
  assert.throws(() => bsToAd({ year:2080, month:1, day:33 }));
  assert.throws(() => bsToAd({ year:1999, month:1, day:1 }));
  assert.throws(() => bsToAd({ year:2080, month:1, day:1.5 }));
});

test('changing months safely clamps days, including Gregorian leap years', () => {
  assert.equal(daysInMonth('AD',2024,2),29);
  assert.equal(daysInMonth('AD',2025,2),28);
  assert.deepEqual(clampPickerDate('AD',{ year:2025, month:2, day:31 }),{ year:2025, month:2, day:28 });
  assert.equal(clampPickerDate('BS',{ year:2080, month:12, day:32 }).day,daysInMonth('BS',2080,12));
  assert.deepEqual(clampPickerDate('AD',{ year:1943, month:1, day:1 }),MIN_AD_DATE);
});

test('Today changes at Nepal midnight, independent of device time zone', () => {
  assert.equal(numericDate(todayInNepal(new Date('2026-09-08T18:14:59Z'))),'2026-09-08');
  assert.equal(numericDate(todayInNepal(new Date('2026-09-08T18:15:00Z'))),'2026-09-09');
});
