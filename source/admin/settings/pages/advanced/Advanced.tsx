import { selectSettings } from "~/redux/features/settings";
import PageContainer from "~/components/pageContainer";
import SettingsField from "~/components/settingsField";
import { useAppSelector } from "~/redux/hooks";
import Switcher from "~/components/switcher";
import Field from "~/components/field";
import useSave from "~/hooks/useSave";

const Advanced = () => {
    const { data } = useAppSelector(selectSettings);

    const { saveSettings } = useSave();

    const { action, organization } = data?.advanced || {};

    const { contextMenu, undoActions } = action || {};

    const { dynamicFolders, groupUncategorized, unused } = organization || {};

    return (
        <PageContainer>
            <Field
                title="Actions"
                description="Configure interactive actions available in the media library."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Enable or disable the context menu in the media library."
                    action={
                        <Switcher
                            title="Enable context menu"
                            checked={contextMenu}
                            onChange={() =>
                                saveSettings(
                                    "advanced.action.contextMenu",
                                    !contextMenu,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Show a brief window to undo a folder deletion before it becomes permanent."
                    action={
                        <Switcher
                            title="Undo after folder delete"
                            checked={undoActions}
                            onChange={() =>
                                saveSettings(
                                    "advanced.action.undoActions",
                                    !undoActions,
                                )
                            }
                        />
                    }
                />
            </Field>

            <Field
                title="Organization"
                description="Control how media files are automatically grouped and organized."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Show system-generated folders that automatically group media by type, date, and other criteria."
                    action={
                        <Switcher
                            title="Dynamic folders"
                            checked={dynamicFolders}
                            onChange={() =>
                                saveSettings(
                                    "advanced.organization.dynamicFolders",
                                    !dynamicFolders,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Collect files that have not been assigned to any folder into a single uncategorized group."
                    action={
                        <Switcher
                            title="Group uncategorized files"
                            checked={groupUncategorized}
                            onChange={() =>
                                saveSettings(
                                    "advanced.organization.groupUncategorized",
                                    !groupUncategorized,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Display a dynamic folder that lists all media files not currently attached to any post or page."
                    action={
                        <Switcher
                            title="Unused files"
                            checked={unused}
                            onChange={() =>
                                saveSettings(
                                    "advanced.organization.unused",
                                    !unused,
                                )
                            }
                        />
                    }
                />
            </Field>
        </PageContainer>
    );
};

export default Advanced;
