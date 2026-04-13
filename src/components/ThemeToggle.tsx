import { Theme } from "../hooks/useTheme";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button className="theme-toggle" onClick={onToggle}>
      {theme === "light" ? "深色" : "浅色"}
    </button>
  );
}

export default ThemeToggle;
