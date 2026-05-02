import { ToggleThemeProps } from "./ToggleTheme.type";
import { useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import Button from "../button";

const ToggleTheme = ({ theme, setTheme }: ToggleThemeProps) => {
    useEffect(() => {
        const root = document?.documentElement;

        root?.setAttribute("pnpnm-theme-status", theme);
    }, [theme]);

    return (
        <Button
            variant={theme === "light" ? "outlined" : "primary"}
            startIcon={theme === "light" ? "dark_mode" : "light_mode"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
            {theme === "light"
                ? __("Dark Mode", "ninja-media")
                : __("Light Mode", "ninja-media")}
        </Button>
    );
};

export default ToggleTheme;
