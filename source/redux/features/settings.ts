import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NestedKey, NestedValue } from "~/utils/types";
import { setNestedValue } from "~/utils/functions";
import { SettingsState } from "~/types/states";
import { Settings } from "~/types/settings";
import { RootState } from "../store";

const initialState: SettingsState = {
    data: null,
    defaultData: null,
    draft: null,
};

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        settingsInit: (
            state,
            action: PayloadAction<{
                data: Settings;
                defaultData: Settings;
            }>,
        ) => {
            state.data = action.payload.data;
            state.defaultData = action.payload.defaultData;
            state.draft = action.payload.data;
        },

        updateSettings: <Path extends NestedKey<Settings>>(
            state: SettingsState,
            action: PayloadAction<{
                path: Path;
                value: NestedValue<Settings, Path>;
            }>,
        ) => {
            if (!state.data) return;

            setNestedValue(
                state.data,
                action.payload.path,
                action.payload.value,
            );
        },

        setDraft: (state, action: PayloadAction<Settings>) => {
            state.draft = action.payload;
        },
    },
});

export const { settingsInit, updateSettings, setDraft } = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

const settingsReducer = settingsSlice.reducer;

export default settingsReducer;
