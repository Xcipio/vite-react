import { useEffect, useState } from "react";
import { fetchWeatherSnapshot, WeatherVisual } from "../lib/weather";
import { requestUserCoordinates } from "../lib/userCoordinates";

type WeatherBadgeProps = {
  locale?: "zh" | "en";
};

const WEATHER_ANIMATION_STORAGE_KEY = "playxeld-weather-animation-enabled";

const WEATHER_LABELS: Record<WeatherVisual, { zh: string; en: string }> = {
  "big-sun": { zh: "大晴天", en: "Bright sun" },
  sunny: { zh: "晴天", en: "Sunny" },
  "partly-cloudy": { zh: "多云", en: "Partly cloudy" },
  overcast: { zh: "阴天", en: "Overcast" },
  "light-rain": { zh: "小雨", en: "Light rain" },
  "moderate-rain": { zh: "中雨", en: "Moderate rain" },
  "heavy-rain": { zh: "大雨", en: "Heavy rain" },
  storm: { zh: "暴风雨", en: "Thunderstorm" },
  lightning: { zh: "闪电", en: "Lightning" },
  windy: { zh: "大风", en: "Windy" },
  "light-snow": { zh: "小雪", en: "Light snow" },
  "heavy-snow": { zh: "大雪", en: "Heavy snow" },
};

function Cloud({
  x = 16,
  y = 19,
  fill = "#d8e7ff",
  opacity = 1,
  className = "",
}: {
  x?: number;
  y?: number;
  fill?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <g className={`weather-cloud ${className}`.trim()} opacity={opacity}>
      <circle cx={x} cy={y + 1} r="6" fill={fill} />
      <circle cx={x + 7} cy={y - 2} r="8" fill={fill} />
      <circle cx={x + 15} cy={y + 1} r="6.5" fill={fill} />
      <rect x={x - 1} y={y + 1} width="24" height="8" rx="4" fill={fill} />
    </g>
  );
}

function Sun({ big = false }) {
  const radius = big ? 9.5 : 8;
  const center = big ? 18 : 14;
  const rays = big ? 10 : 8;

  return (
    <g className="weather-sun" style={{ transformOrigin: `${center}px ${center}px` }}>
      {Array.from({ length: rays }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / rays;
        const inner = radius + 4;
        const outer = radius + 8;
        const x1 = center + Math.cos(angle) * inner;
        const y1 = center + Math.sin(angle) * inner;
        const x2 = center + Math.cos(angle) * outer;
        const y2 = center + Math.sin(angle) * outer;

        return (
          <line
            key={`ray-${index}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#ffb642"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={center} cy={center} r={radius} fill="#ffd45c" />
    </g>
  );
}

function Moon() {
  return (
    <g className="weather-moon">
      <circle className="weather-moon-body" cx="18" cy="18" r="10" fill="#cfe0ff" />
      <circle className="weather-moon-cutout" cx="22.5" cy="14.5" r="10" fill="#0b1020" />
      <circle className="weather-moon-star" cx="11.8" cy="11.4" r="1.2" fill="#eef4ff" opacity="0.95" />
      <circle className="weather-moon-star" cx="27.5" cy="9.8" r="1" fill="#eef4ff" opacity="0.85" />
      <circle className="weather-moon-star" cx="31.2" cy="18.4" r="1.1" fill="#eef4ff" opacity="0.9" />
    </g>
  );
}

function Rain({ heavy = false }) {
  const drops = heavy ? [12, 20, 28] : [15, 24];
  const length = heavy ? 8 : 6.4;
  const color = heavy ? "#55a7ff" : "#6ec0ff";

  return (
    <g className="weather-rain">
      {drops.map((x, index) => (
        <line
          key={`rain-${x}`}
          className="weather-rain-drop"
          x1={x}
          y1={30 + index}
          x2={x - 2.8}
          y2={30 + index + length}
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}
    </g>
  );
}

function Snow({ heavy = false }) {
  const flakes = heavy ? [13, 20, 27] : [16, 24];

  return (
    <g className="weather-snow" stroke="#edf6ff" strokeWidth="1.8" strokeLinecap="round">
      {flakes.map((x, index) => {
        const y = 31 + index;
        return (
          <g
            key={`snow-${x}`}
            className="weather-snowflake"
            style={{ animationDelay: `${index * 0.22}s` }}
          >
            <line x1={x - 2.8} y1={y} x2={x + 2.8} y2={y} />
            <line x1={x} y1={y - 2.8} x2={x} y2={y + 2.8} />
            <line x1={x - 2.1} y1={y - 2.1} x2={x + 2.1} y2={y + 2.1} />
            <line x1={x - 2.1} y1={y + 2.1} x2={x + 2.1} y2={y - 2.1} />
          </g>
        );
      })}
    </g>
  );
}

function Wind() {
  return (
    <g className="weather-wind" fill="none" stroke="#8ec5ff" strokeWidth="2.3" strokeLinecap="round">
      <path className="weather-wind-stroke" d="M8 18h18c4.2 0 4.8-6 0.8-6 0 0-2.1 0-3 1.4" />
      <path
        className="weather-wind-stroke"
        style={{ animationDelay: "0.18s" }}
        d="M8 24h24c4.5 0 5.6 6 0.6 6-1.9 0-3.2-0.9-4.2-2.2"
      />
      <path
        className="weather-wind-stroke"
        style={{ animationDelay: "0.36s" }}
        d="M8 30h12c4.2 0 4.8 6 0.8 6 0 0-2.1 0-3-1.4"
      />
    </g>
  );
}

function LightningBolt() {
  return (
    <path
      className="weather-lightning"
      d="M22 23h6l-4.2 7.2h4.4L19 42l2.8-8h-4.3L22 23Z"
      fill="#ffd45c"
      stroke="#f2a900"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  );
}

function WeatherIcon({
  visual,
  isDay,
}: {
  visual: WeatherVisual;
  isDay: boolean;
}) {
  if ((visual === "big-sun" || visual === "sunny") && !isDay) {
    return <Moon />;
  }

  switch (visual) {
    case "big-sun":
      return <Sun big />;
    case "sunny":
      return <Sun />;
    case "partly-cloudy":
      return (
        <>
          <g transform="translate(-2,-2)">
            <Sun />
          </g>
          <Cloud />
        </>
      );
    case "overcast":
      return (
        <>
          <Cloud fill="#ccdaef" />
          <Cloud
            x={10}
            y={23}
            fill="#b8c9e3"
            opacity={0.92}
            className="weather-cloud-secondary"
          />
        </>
      );
    case "light-rain":
      return (
        <>
          <Cloud />
          <Rain />
        </>
      );
    case "moderate-rain":
      return (
        <>
          <Cloud fill="#cfdef4" />
          <Rain heavy />
        </>
      );
    case "heavy-rain":
      return (
        <>
          <Cloud fill="#c4d4ec" />
          <Cloud
            x={12}
            y={21}
            fill="#9cb5d8"
            opacity={0.95}
            className="weather-cloud-secondary"
          />
          <Rain heavy />
        </>
      );
    case "storm":
      return (
        <>
          <Cloud fill="#b2c0d8" />
          <Rain />
          <LightningBolt />
        </>
      );
    case "lightning":
      return (
        <>
          <Cloud fill="#abb8cf" />
          <LightningBolt />
        </>
      );
    case "windy":
      return <Wind />;
    case "light-snow":
      return (
        <>
          <Cloud />
          <Snow />
        </>
      );
    case "heavy-snow":
      return (
        <>
          <Cloud fill="#dceaff" />
          <Cloud
            x={11}
            y={22}
            fill="#c8def7"
            opacity={0.94}
            className="weather-cloud-secondary"
          />
          <Snow heavy />
        </>
      );
    default:
      return <Sun big />;
  }
}

function WeatherBadge({ locale = "zh" }: WeatherBadgeProps) {
  const [visual, setVisual] = useState<WeatherVisual>("sunny");
  const [isDay, setIsDay] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadWeather = async () => {
      const coordinates = await requestUserCoordinates();
      if (!coordinates) {
        return;
      }

      try {
        const snapshot = await fetchWeatherSnapshot(coordinates);
        if (isActive) {
          setVisual(snapshot.visual);
          setIsDay(snapshot.isDay);
        }
      } catch (error) {
        console.error("Failed to load local weather:", error);
      }
    };

    void loadWeather();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.setAttribute("data-weather-visual", visual);

    return () => {
      document.body.removeAttribute("data-weather-visual");
    };
  }, [visual]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(WEATHER_ANIMATION_STORAGE_KEY);
    if (stored === "false") {
      setAnimationEnabled(false);
    }
  }, []);

  const label = WEATHER_LABELS[visual][locale];
  const toggleLabel =
    locale === "en"
      ? animationEnabled
        ? "Click to pause weather animation"
        : "Click to resume weather animation"
      : animationEnabled
        ? "点击暂停天气动画"
        : "点击恢复天气动画";

  return (
    <button
      type="button"
      className={`weather-badge weather-badge-${visual} ${
        animationEnabled ? "weather-badge-animated" : "weather-badge-paused"
      }`}
      aria-label={`${
        locale === "en" ? `Local weather: ${label}` : `当地天气：${label}`
      } ${toggleLabel}`}
      title={`${label} · ${toggleLabel}`}
      onClick={() => {
        const next = !animationEnabled;
        setAnimationEnabled(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            WEATHER_ANIMATION_STORAGE_KEY,
            String(next),
          );
        }
      }}
    >
      <svg viewBox="0 0 46 46" role="img" aria-hidden="true">
        <WeatherIcon visual={visual} isDay={isDay} />
      </svg>
    </button>
  );
}

export default WeatherBadge;
