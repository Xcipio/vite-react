import { Theme } from "../hooks/useTheme";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type SolarBoundary = {
  sunrise: Date;
  sunset: Date;
};

const DEFAULT_SUNRISE_HOUR = 7;
const DEFAULT_SUNSET_HOUR = 19;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function normalizeHours(value: number) {
  return ((value % 24) + 24) % 24;
}

function calculateSolarTime(
  date: Date,
  latitude: number,
  longitude: number,
  isSunrise: boolean,
) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfYear =
    Math.floor(
      (Date.UTC(year, month, day) - Date.UTC(year, 0, 0)) / 86400000,
    );

  const longitudeHour = longitude / 15;
  const approximateTime =
    dayOfYear + ((isSunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = 0.9856 * approximateTime - 3.289;

  let trueLongitude =
    meanAnomaly +
    1.916 * Math.sin(toRadians(meanAnomaly)) +
    0.02 * Math.sin(toRadians(2 * meanAnomaly)) +
    282.634;
  trueLongitude = normalizeDegrees(trueLongitude);

  let rightAscension = toDegrees(
    Math.atan(0.91764 * Math.tan(toRadians(trueLongitude))),
  );
  rightAscension = normalizeDegrees(rightAscension);

  const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
  const ascensionQuadrant = Math.floor(rightAscension / 90) * 90;
  rightAscension += longitudeQuadrant - ascensionQuadrant;
  rightAscension /= 15;

  const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHourAngle =
    (Math.cos(toRadians(90.833)) -
      sinDeclination * Math.sin(toRadians(latitude))) /
    (cosDeclination * Math.cos(toRadians(latitude)));

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    return null;
  }

  let hourAngle = isSunrise
    ? 360 - toDegrees(Math.acos(cosHourAngle))
    : toDegrees(Math.acos(cosHourAngle));
  hourAngle /= 15;

  const localMeanTime =
    hourAngle + rightAscension - 0.06571 * approximateTime - 6.622;
  const universalTime = normalizeHours(localMeanTime - longitudeHour);
  const timezoneOffsetHours =
    -new Date(year, month, day, 12, 0, 0, 0).getTimezoneOffset() / 60;
  const localHours = normalizeHours(universalTime + timezoneOffsetHours);
  const localMidnight = new Date(year, month, day, 0, 0, 0, 0).getTime();

  return new Date(localMidnight + localHours * 3600000);
}

export function getSolarBoundary(
  date: Date,
  coordinates?: Coordinates | null,
): SolarBoundary {
  if (!coordinates) {
    const sunrise = new Date(date);
    sunrise.setHours(DEFAULT_SUNRISE_HOUR, 0, 0, 0);

    const sunset = new Date(date);
    sunset.setHours(DEFAULT_SUNSET_HOUR, 0, 0, 0);

    return { sunrise, sunset };
  }

  const sunrise =
    calculateSolarTime(date, coordinates.latitude, coordinates.longitude, true) ??
    new Date(new Date(date).setHours(DEFAULT_SUNRISE_HOUR, 0, 0, 0));
  const sunset =
    calculateSolarTime(date, coordinates.latitude, coordinates.longitude, false) ??
    new Date(new Date(date).setHours(DEFAULT_SUNSET_HOUR, 0, 0, 0));

  return { sunrise, sunset };
}

export function getAutoTheme(
  now: Date,
  coordinates?: Coordinates | null,
): Theme {
  const { sunrise, sunset } = getSolarBoundary(now, coordinates);
  return now >= sunrise && now < sunset ? "light" : "dark";
}

export function getNextThemeTransition(
  now: Date,
  coordinates?: Coordinates | null,
) {
  const todayBoundary = getSolarBoundary(now, coordinates);

  if (now < todayBoundary.sunrise) {
    return todayBoundary.sunrise;
  }

  if (now < todayBoundary.sunset) {
    return todayBoundary.sunset;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return getSolarBoundary(tomorrow, coordinates).sunrise;
}
