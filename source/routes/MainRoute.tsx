import { settingsInit } from "~/redux/features/settings/settings";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useEffect } from "@wordpress/element";
import { useAppDispatch } from "~/redux/hooks";

const MainRoute = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useLocalStorage<"light" | "dark">(
        "pnpnm-theme-status",
        "light",
    );

    const dispatch = useAppDispatch();

    const defaultSettings = pnpnm?.defaultSettings || {};

    const settings = pnpnm?.settings || defaultSettings || {};

    useEffect(() => {
        const root = document?.documentElement;

        root?.setAttribute("pnpnm-theme-status", theme);
    }, [theme]);

    useEffect(() => {
        const updateMenu = () => {
            const currentMenu = location.hash.split("/")[1];

            const anchors = Array.from(
                document.querySelectorAll<HTMLAnchorElement>(
                    'a[href*="page=ninja-media#"]',
                ),
            );

            anchors.forEach((a) => a.classList.remove("current"));

            const activeAnchor = anchors
                .filter((a) => {
                    const href = a.getAttribute("href") || "";

                    return href.split("#/")[1]?.split("/")[0] === currentMenu;
                })
                .at(-1);

            activeAnchor?.classList.add("current");
        };

        updateMenu();

        window.addEventListener("hashchange", updateMenu);

        return () => window.removeEventListener("hashchange", updateMenu);
    }, []);

    useEffect(() => {
        dispatch(
            settingsInit({
                defaultData: defaultSettings,
                data: settings,
            }),
        );
    }, [defaultSettings, settings]);

    return <>{children}</>;
};

export default MainRoute;
