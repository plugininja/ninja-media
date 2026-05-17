import { Settings } from "./settings";

export type SettingsState = {
    data: Settings | null;
    defaultData: Settings | null;
    draft: Settings | null;
};
