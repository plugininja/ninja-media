import { settingsInit } from "~/redux/features/settings/settings";
import { useCustomAlert } from "~/components/alert/Alert";
import PageContainer from "~/components/pageContainer";
import SettingsField from "~/components/settingsField";
import { Settings } from "~/types/settings/settings";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "~/redux/hooks";
import { __, sprintf } from "@wordpress/i18n";
import useSettings from "~/hooks/useSettings";
import Switcher from "~/components/switcher";
import Button from "~/components/button";
import Field from "~/components/field";
import DOCS from "~/constants/docs";

const Tools = () => {
    const { defaultData, data, setSettings, saveSettings } = useSettings();

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
                    saveSettings(importedData);

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
            title: __("Reset Settings", "ninja-media"),
            text: __(
                "Are you sure you want to reset all settings?",
                "ninja-media",
            ),
            showCancelButton: true,
            confirmButtonText: __("Reset", "ninja-media"),
            onConfirm: async () => {
                try {
                    if (!defaultData) return;

                    await saveSettings(defaultData);

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
                            error?.data?.message ||
                            __("Failed to reset settings!", "ninja-media"),
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
                title={__("Cleanup Tools", "ninja-media")}
                description={__(
                    "Manage what happens to plugin data when the plugin is deactivated or uninstalled.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    description={__(
                        "Permanently remove all plugin data — folders, settings, and database tables — when the plugin is uninstalled.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Delete plugin data on uninstall",
                                "ninja-media",
                            )}
                            checked={deleteOnUninstall}
                            onChange={() =>
                                setSettings(
                                    "tools.deleteOnUninstall",
                                    !deleteOnUninstall,
                                )
                            }
                        />
                    }
                />
            </Field>

            <Field
                title={__("Backup & Restore", "ninja-media")}
                description={__(
                    "Export your settings to a file, import a saved configuration, or reset everything back to defaults.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    description={__(
                        "Automatically save setting changes as you make them, without needing to click the Save button.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Enable Auto Save", "ninja-media")}
                            checked={autoSave}
                            onChange={() =>
                                setSettings("tools.autoSave", !autoSave)
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    title={__("Export Data:", "ninja-media")}
                    description={__(
                        "Download all current plugin settings as a JSON file. Use this to back up your configuration or transfer it to another site.",
                        "ninja-media",
                    )}
                    secondaryAction={
                        <Button
                            variant="primary"
                            size="small"
                            startIcon="output_circle"
                            onClick={handleExport}
                        >
                            {__("Export", "ninja-media")}
                        </Button>
                    }
                />

                <SettingsField
                    background="extralight"
                    title={__("Import Data:", "ninja-media")}
                    description={__(
                        "Select the exported JSON file you would like to import. Please note that the import will replace the current data.",
                        "ninja-media",
                    )}
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
                                {__("Import", "ninja-media")}
                            </Button>
                        </>
                    }
                />

                <SettingsField
                    background="extralight"
                    title={__("Reset Settings", "ninja-media")}
                    description={__(
                        "Restore all plugin settings to their original default values. This cannot be undone.",
                        "ninja-media",
                    )}
                    secondaryAction={
                        <Button
                            variant="error"
                            size="small"
                            startIcon="autorenew"
                            onClick={handleReset}
                        >
                            {__("Reset", "ninja-media")}
                        </Button>
                    }
                />
            </Field>
        </PageContainer>
    );
};

export default Tools;
