import { Dashboard } from "./dashboard";

declare global {
    const pnpnm: {
        restUrl: string;
        ajaxUrl: string;
        siteUrl: string;
        upgradeUrl: string;
        version: string;
        textDomain: string;
        isPlain: boolean;
        nonce: string;
        pagenow: string;
        defaultSettings: Dashboard;
        settings: Dashboard;
        maxUploadSize: number;
        perPage: number;
    };

    interface Window {
        pnpnm: typeof pnpnm;
        wp: any;
        pnpnmMedia: any;
        openUpgradePopUp: () => void;
        pnpnmAdjustSidebarWidth?: (width: number) => void;
    }
}
