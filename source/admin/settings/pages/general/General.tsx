import { selectSettings } from "~/redux/features/settings";
import PageContainer from "~/components/pageContainer";
import SettingsField from "~/components/settingsField";
import InlineStack from "~/components/inlineStack";
import { useAppSelector } from "~/redux/hooks";
import Checkbox from "~/components/checkbox";
import Switcher from "~/components/switcher";
import Field from "~/components/field";
import Input from "~/components/input";
import useSave from "~/hooks/useSave";
import Text from "~/components/text";

const General = () => {
    const { data } = useAppSelector(selectSettings);

    const { saveSettings } = useSave();

    const { folder, files, svgSupport } = data?.general || {};

    const { forceSorting, showFolders, showFolderId, treeConnector } =
        folder || {};

    const {
        bulkSelection,
        replaceMedia,
        moveToTrash,
        controlUploadSize,
        uploadSize,
    } = files || {};

    const { uploadSupport, sanitization } = svgSupport || {};

    return (
        <PageContainer>
            <Field
                title="Folder"
                description="Control how folders behave and appear in the media library."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Automatically places new folders in order instead of at the bottom."
                    action={
                        <Switcher
                            title="Force sorting when adding new folders"
                            checked={forceSorting}
                            onChange={() =>
                                saveSettings(
                                    "general.folder.forceSorting",
                                    !forceSorting,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Displays your media folders directly in the WordPress admin sidebar."
                    action={
                        <Switcher
                            title="Show folders in admin menu"
                            checked={showFolders}
                            onChange={() =>
                                saveSettings(
                                    "general.folder.showFolders",
                                    !showFolders,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Displays the folder ID in the file details which can be useful for dynamic folders to identify the folder structure."
                    action={
                        <Switcher
                            title="Show folder ID"
                            checked={showFolderId}
                            onChange={() =>
                                saveSettings(
                                    "general.folder.showFolderId",
                                    !showFolderId,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="A UI element that connects parent and child nodes in a tree structure using lines or arrows."
                    action={
                        <Switcher
                            title="Tree Connector"
                            checked={treeConnector}
                            onChange={() =>
                                saveSettings(
                                    "general.folder.treeConnector",
                                    !treeConnector,
                                )
                            }
                        />
                    }
                />
            </Field>

            <Field
                title="Files"
                description="Control file behavior, selection, and upload options."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Select multiple files at once and drag them to any folder in a single action."
                    action={
                        <Switcher
                            title="Bulk selection and bulk drag"
                            checked={bulkSelection}
                            onChange={() =>
                                saveSettings(
                                    "general.files.bulkSelection",
                                    !bulkSelection,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Swap any media file with a new one while keeping all existing links and references intact."
                    action={
                        <Switcher
                            title="Replace Media"
                            checked={replaceMedia}
                            onChange={() =>
                                saveSettings(
                                    "general.files.replaceMedia",
                                    !replaceMedia,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Send files to the trash instead of deleting them permanently, giving you a chance to recover them."
                    action={
                        <Switcher
                            title="Move files to trash before deleting"
                            checked={moveToTrash}
                            onChange={() =>
                                saveSettings(
                                    "general.files.moveToTrash",
                                    !moveToTrash,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={`Control the maximum upload file size for the media library. Current server limit: ${pnpnm.maxUploadSize} MB.`}
                    action={
                        <Switcher
                            id="control-upload-size-switcher"
                            title="Control maximum upload file size"
                            checked={controlUploadSize}
                            onChange={() =>
                                saveSettings(
                                    "general.files.controlUploadSize",
                                    !controlUploadSize,
                                )
                            }
                        />
                    }
                >
                    <SettingsField.SubField
                        background="white"
                        title="Maximum upload size"
                        description={`Set a custom upload size limit in MB. The server allows up to ${pnpnm.maxUploadSize} MB.`}
                        depend={!controlUploadSize}
                        dependOn="control-upload-size-switcher"
                        secondaryAction={
                            <Input
                                type="number"
                                size="small"
                                fullWidth={false}
                                customWidth="150px"
                                suffix="MB"
                                value={uploadSize || ""}
                                onChange={(value) =>
                                    saveSettings(
                                        "general.files.uploadSize",
                                        Number(value),
                                    )
                                }
                            />
                        }
                    />
                </SettingsField>
            </Field>

            <Field
                title="SVG Support"
                description="Control SVG file upload support and security settings."
                docLink="https://plugininja.com"
            >
                <SettingsField
                    background="extralight"
                    description="Support for uploading SVG files to the media library. Please note that enabling this option can pose security risks if you upload SVG files from untrusted sources."
                    action={
                        <Switcher
                            title="SVG upload support"
                            checked={uploadSupport}
                            onChange={() =>
                                saveSettings(
                                    "general.svgSupport.uploadSupport",
                                    !uploadSupport,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description="Automatically strip potentially harmful code from uploaded SVG files to keep your site safe."
                    action={
                        <Switcher
                            title="Built-in SVG sanitization"
                            checked={sanitization}
                            onChange={() =>
                                saveSettings(
                                    "general.svgSupport.sanitization",
                                    !sanitization,
                                )
                            }
                        />
                    }
                />
            </Field>
        </PageContainer>
    );
};

export default General;
