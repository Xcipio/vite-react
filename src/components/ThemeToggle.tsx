import { Theme } from "../hooks/useTheme";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
  locale?: "zh" | "en";
};

function ThemeToggle({
  theme,
  onToggle,
  locale = "zh",
}: ThemeToggleProps) {
  const label =
    locale === "en"
      ? theme === "light"
        ? "Dark"
        : "Light"
      : theme === "light"
        ? "深色"
        : "浅色";

  return (
    <button className="theme-toggle" onClick={onToggle}>
      {label}
    </button>
  );
}

export default ThemeToggle;
