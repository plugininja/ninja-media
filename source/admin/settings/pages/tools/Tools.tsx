import { selectSettings, settingsInit } from "~/redux/features/settings";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useCustomAlert } from "~/components/alert/Alert";
import PageContainer from "~/components/pageContainer";
import SettingsField from "~/components/settingsField";
import { useNavigate } from "react-router-dom";
import Switcher from "~/components/switcher";
import { Settings } from "~/types/settings";
import Button from "~/components/button";
import Field from "~/components/field";
import useSave from "~/hooks/useSave";
import { __ } from "@wordpress/i18n";

const Tools = () => {
    const { defaultData, data } = useAppSelector(selectSettings);

    const { saveSettings, saveSettingsData } = useSave();

    const dispatch = useAppDispatch();

    const { showAlert } = useCustomAlert();

    const navigate = useNavigate();

    const { autoSave, deleteOnUninstall } = data?.tools || {};

    const handleExport = () => {
        const dataString =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(data, null, 2));

        const downloadAnchorNode = document.createElement("a");

        downloadAnchorNode.setAttribute("href", dataString);
        downloadAnchorNode.setAttribute(
            "download",
            `advanced_media_library_${new Date().getTime()}.json`,
        );
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        showAlert({
            toast: true,
            type: "success",
            text: __("Data exported successfully!", "ninja-media"),
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
        });
    };

    const handleImport = () => {
        const importInput = document.getElementById(
            "pnpnm-import-input",
        ) as HTMLInputElement;

        importInput?.click();
    };

    const handleImportData = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            console.error(__("No file selected for import", "ninja-media"));
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const result = e.target?.result;

                if (typeof result !== "string") {
                    throw new Error("Invalid file content");
                }

                const importedData = JSON.parse(result);

                if (importedData) {
                    saveSettingsData(importedData);

                    dispatch(
                        settingsInit({
                            defaultData: defaultData as Settings,
                            data: importedData,
                        }),
                    );
                }
            } catch (error) {
                console.error(
                    __("Failed to import data:", "ninja-media"),
                    error,
                );
            }
        };

        reader.onerror = (error) => {
            console.error(__("Error reading file:", "ninja-media"), error);
        };

        reader.readAsText(file);
        event.target.value = "";
    };

    const handleReset = () => {
        showAlert({
            type: "error",
            title: "Reset Settings",
            text: "Are you sure you want to reset all settings?",
            showCancelButton: true,
            confirmButtonText: "Reset",
            onConfirm: async () => {
                try {
                    if (!defaultData) return;

                    await saveSettingsData(defaultData);

                    dispatch(
                        settingsInit({
                            defaultData: defaultData as Settings,
                            data: defaultData as Settings,
                        }),
                    );

                    const color =
                        defaultData?.display?.theme?.color || "#2271b1";

                    const root = document.documentElement;

                    if (root && color) {
                        root.style.setProperty("--pnpnm-primary", color);
                    }

                    navigate("/settings/accounts");
                } catch (error: any) {
                    showAlert({
                        toast: true,
                        type: "error",
                        text:
                            error?.data?.message || "Failed to reset settings!",
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                }
            },
        });
    };

    return (
        <PageContainer>
            <Field
                title="Cleanup Tools"
                description="Manage plugin data and control what happens when the plugin is removed."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Remove all folders, settings, and plugin data from the database when the plugin is uninstalled. This action cannot be undone."
                    action={
                        <Switcher
                            title="Delete plugin data on uninstall"
                            checked={deleteOnUninstall}
                            onChange={() =>
                                saveSettings(
                                    "tools.deleteOnUninstall",
                                    !deleteOnUninstall,
                                )
                            }
                        />
                    }
                />
            </Field>

            <Field
                title="Backup & Restore"
                description="Export your settings to a file or import them from a previous backup."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Automatically save settings as you make changes, without needing to click a save button."
                    action={
                        <Switcher
                            title="Enable Auto Save"
                            checked={autoSave}
                            onChange={() =>
                                saveSettings("tools.autoSave", !autoSave)
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    title="Export Data"
                    description="Download all plugin settings as a JSON file you can use to restore or migrate to another site."
                    secondaryAction={
                        <Button
                            variant="primary"
                            size="small"
                            startIcon="output_circle"
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                    }
                />

                <SettingsField
                    background="extralight"
                    title="Import Data"
                    description="Upload a previously exported JSON file to restore settings. This will overwrite your current configuration."
                    secondaryAction={
                        <>
                            <input
                                id="pnpnm-import-input"
                                type="file"
                                accept=".json"
                                style={{ display: "none" }}
                                onChange={handleImportData}
                            />
                            <Button
                                variant="primary"
                                size="small"
                                startIcon="input_circle"
                                onClick={handleImport}
                            >
                                Import
                            </Button>
                        </>
                    }
                />

                <SettingsField
                    background="extralight"
                    title="Reset Settings"
                    description="Restore all settings to their default values. This cannot be undone."
                    secondaryAction={
                        <Button
                            variant="error"
                            size="small"
                            startIcon="autorenew"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    }
                />
            </Field>
        </PageContainer>
    );
};

export default Tools;
