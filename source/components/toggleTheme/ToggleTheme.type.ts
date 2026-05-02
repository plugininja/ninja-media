export interface ToggleThemeProps {
    theme: "light" | "dark";
    setTheme: (theme: "light" | "dark") => void;
}