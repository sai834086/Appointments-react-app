import { useState, useEffect } from "react";
import styles from "./WeatherBadge.module.css";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";

/**
 * WeatherBadge — compact current-weather chip for the welcome banner.
 *
 * Data: Open-Meteo (https://open-meteo.com) — free for non-commercial use,
 * no API key, CORS-enabled. Location comes from the browser's geolocation
 * API; if the user declines (or anything fails), the badge renders nothing
 * so the banner stays clean.
 *
 * The result is cached in sessionStorage for 30 minutes to avoid hammering
 * the API on every dashboard visit.
 */

const CACHE_KEY = "dashboard.weather.v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

/* WMO weather codes → icon + label.
   https://open-meteo.com/en/docs#weathervariables */
function describeWeather(code) {
  if (code === 0) return { icon: Sun, label: "Clear sky" };
  if (code === 1 || code === 2) return { icon: CloudSun, label: "Partly cloudy" };
  if (code === 3) return { icon: Cloud, label: "Overcast" };
  if (code === 45 || code === 48) return { icon: CloudFog, label: "Foggy" };
  if (code >= 51 && code <= 57) return { icon: CloudDrizzle, label: "Drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { icon: CloudRain, label: "Rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { icon: CloudSnow, label: "Snow" };
  if (code >= 95) return { icon: CloudLightning, label: "Thunderstorm" };
  return { icon: Cloud, label: "Cloudy" };
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* non-fatal */
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 15 * 60 * 1000 },
    );
  });
}

export default function WeatherBadge() {
  // status: "loading" | "ready" | "hidden"
  const [status, setStatus] = useState("loading");
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    if (cached) {
      setWeather(cached);
      setStatus("ready");
      return undefined;
    }

    const load = async () => {
      try {
        const coords = await getPosition();
        const useFahrenheit = (navigator.language || "").toLowerCase() === "en-us";
        const params = new URLSearchParams({
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
          current: "temperature_2m,weather_code",
          daily: "temperature_2m_max,temperature_2m_min",
          forecast_days: "1",
          timezone: "auto",
          ...(useFahrenheit ? { temperature_unit: "fahrenheit" } : {}),
        });
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        );
        if (!response.ok) throw new Error(`Weather API ${response.status}`);
        const json = await response.json();

        const data = {
          temp: Math.round(json?.current?.temperature_2m),
          code: json?.current?.weather_code ?? 3,
          high: Math.round(json?.daily?.temperature_2m_max?.[0]),
          low: Math.round(json?.daily?.temperature_2m_min?.[0]),
          unit: json?.current_units?.temperature_2m || "°",
        };
        if (Number.isNaN(data.temp)) throw new Error("Malformed weather payload");

        writeCache(data);
        if (!cancelled) {
          setWeather(data);
          setStatus("ready");
        }
      } catch {
        // Permission denied / offline / API hiccup — just hide the badge.
        if (!cancelled) setStatus("hidden");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "hidden") return null;

  if (status === "loading") {
    return <span className={styles.skeleton} aria-hidden="true" />;
  }

  const { icon: Icon, label } = describeWeather(weather.code);

  return (
    <div
      className={styles.badge}
      role="group"
      aria-label={`Current weather: ${label}, ${weather.temp}${weather.unit}. Today's high ${weather.high}, low ${weather.low}.`}
      title={label}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon size={22} strokeWidth={2} />
      </span>
      <span className={styles.tempBlock}>
        <span className={styles.temp}>
          {weather.temp}
          {weather.unit}
        </span>
        <span className={styles.range}>
          {label} · H {weather.high}° L {weather.low}°
        </span>
      </span>
    </div>
  );
}
