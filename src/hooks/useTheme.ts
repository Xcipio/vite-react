import { useEffect, useState } from "react";
import { getAutoTheme, getNextThemeTransition } from "../lib/solarTheme";
import {
  readStoredCoordinates,
  requestUserCoordinates,
  StoredCoordinates,
} from "../lib/userCoordinates";

export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "theme";
const THEME_MODE_STORAGE_KEY = "theme-mode";
const THEME_OVERRIDE_UNTIL_STORAGE_KEY = "theme-override-until";
const THEME_TRANSITION_CLASS = "theme-shift-active";
type ThemeMode = "auto" | "manual";

function resolveTimeAccent(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  if (hour < 5) {
    return "midnight";
  }

  const isFestive =
    (month === 12 && day >= 24 && day <= 26) ||
    (month === 1 && day === 1) ||
    (month === 2 && day === 14);

  return isFestive ? "festive" : "none";
}

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedMode === "manual") {
    return savedTheme === "light" ? "light" : "dark";
  }

  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);
  const [coordinates, setCoordinates] = useState<StoredCoordinates | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return readStoredCoordinates();
  });

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const body = document.body;
    body.classList.add(THEME_TRANSITION_CLASS);
    const timeout = window.setTimeout(() => {
      body.classList.remove(THEME_TRANSITION_CLASS);
    }, 850);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [theme]);

  useEffect(() => {
    const syncTimeAccent = () => {
      document.body.setAttribute("data-time-accent", resolveTimeAccent(new Date()));
    };

    syncTimeAccent();
    const interval = window.setInterval(syncTimeAccent, 15 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const savedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
    const overrideUntilRaw = window.localStorage.getItem(THEME_OVERRIDE_UNTIL_STORAGE_KEY);
    const overrideUntil = overrideUntilRaw ? Number(overrideUntilRaw) : null;

    if (savedMode === "manual" && overrideUntil && now.getTime() < overrideUntil) {
      return;
    }

    if (savedMode === "manual") {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, "auto");
      window.localStorage.removeItem(THEME_OVERRIDE_UNTIL_STORAGE_KEY);
    }

    setTheme(getAutoTheme(now, coordinates));

    const nextTransition = getNextThemeTransition(now, coordinates);
    const timeout = window.setTimeout(() => {
      setTheme(getAutoTheme(new Date(), coordinates));
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, "auto");
      window.localStorage.removeItem(THEME_OVERRIDE_UNTIL_STORAGE_KEY);
    }, Math.max(1000, nextTransition.getTime() - now.getTime() + 1000));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [coordinates]);

  useEffect(() => {
    if (coordinates) {
      return;
    }

    const syncCoordinates = async () => {
      const nextCoordinates = await requestUserCoordinates();

      if (nextCoordinates) {
        setCoordinates(nextCoordinates);
        return;
      }

      setTheme(getAutoTheme(new Date(), null));
    };

    void syncCoordinates();
  }, [coordinates]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    const nextTransition = getNextThemeTransition(new Date(), coordinates);

    setTheme(nextTheme);
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, "manual");
    window.localStorage.setItem(
      THEME_OVERRIDE_UNTIL_STORAGE_KEY,
      String(nextTransition.getTime()),
    );
  };

  return { theme, toggleTheme };
}
