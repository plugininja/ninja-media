import { Settings } from "./settings/settings";

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
        isPro: boolean;
        defaultSettings: Settings;
        settings: Settings;
        maxUploadSize: number;
        perPage: number;
        supportedPostTypes: string[];
        currentPostType: string;
        currentPostFolder: number | null;
    };

    interface Window {
        pnpnm: typeof pnpnm;
        wp: any;
        pnpnmMedia: any;
        pnpnmAdjustSidebarWidth?: (width: number) => void;
    }
}
