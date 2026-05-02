import { useLocalStorage } from "~/hooks/useLocalStorage";
import { settingsInit } from "~/redux/features/settings";
import { useUpgradePopUp } from "~/modal/Upgrade";
import { useEffect } from "@wordpress/element";
import { useAppDispatch } from "~/redux/hooks";

const MainRoute = ({ children }: { children: React.ReactNode }) => {
    const [theme] = useLocalStorage<"light" | "dark">(
        "pnpnm-theme-status",
        "light",
    );

    const dispatch = useAppDispatch();

    const defaultSettings = pnpnm?.defaultSettings || {};

    const settings = pnpnm?.settings || defaultSettings || {};

    const pathname = window?.location?.hash?.split("#")[1] || "/";

    const { showUpgradePopUp } = useUpgradePopUp();

    useEffect(() => {
        const root = document?.documentElement;

        root?.setAttribute("pnpnm-theme-status", theme);
    }, [theme]);

    useEffect(() => {
        const anchors = document.querySelectorAll(
            'a[href^="admin.php?page=ninja-media#"]',
        );

        anchors.forEach((a) => {
            (a as HTMLAnchorElement).classList.remove("current");
        });

        const matched: HTMLAnchorElement[] = [];

        anchors.forEach((a) => {
            const href = a.getAttribute("href");
            const hashPath = href?.split("#")[1];
            const anchor = a as HTMLAnchorElement;

            if (pathname.startsWith(hashPath || "")) {
                matched.push(anchor);
            }
        });

        if (matched.length >= 2) {
            matched[1].classList.add("current");
        } else if (matched.length === 1) {
            matched[0].classList.add("current");
        }
    }, [pathname]);

    useEffect(() => {
        window.openUpgradePopUp = showUpgradePopUp;
    }, [showUpgradePopUp]);

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
