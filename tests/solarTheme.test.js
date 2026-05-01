import test from "node:test";
import assert from "node:assert/strict";

import {
  getAutoTheme,
  getNextThemeTransition,
  getSolarBoundary,
} from "../.tmp-tests/src/lib/solarTheme.js";

const tokyo = {
  latitude: 35.6762,
  longitude: 139.6503,
};

test("uses light theme after sunrise in Tokyo morning", () => {
  const now = new Date("2026-05-02T08:00:00+09:00");

  assert.equal(getAutoTheme(now, tokyo), "light");
});

test("uses dark theme before sunrise in Tokyo morning", () => {
  const now = new Date("2026-05-02T04:00:00+09:00");

  assert.equal(getAutoTheme(now, tokyo), "dark");
});

test("keeps sunrise and sunset on the same local day", () => {
  const now = new Date("2026-05-02T08:00:00+09:00");
  const { sunrise, sunset } = getSolarBoundary(now, tokyo);

  assert.equal(sunrise.getFullYear(), now.getFullYear());
  assert.equal(sunrise.getMonth(), now.getMonth());
  assert.equal(sunrise.getDate(), now.getDate());
  assert.equal(sunset.getFullYear(), now.getFullYear());
  assert.equal(sunset.getMonth(), now.getMonth());
  assert.equal(sunset.getDate(), now.getDate());
  assert.ok(sunrise < sunset);
});

test("returns today's sunset as next transition during daylight", () => {
  const now = new Date("2026-05-02T08:00:00+09:00");
  const { sunset } = getSolarBoundary(now, tokyo);

  assert.equal(getNextThemeTransition(now, tokyo).getTime(), sunset.getTime());
});
