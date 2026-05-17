import PageContainer from "~/components/pageContainer";
import SettingsField from "~/components/settingsField";
import InlineStack from "~/components/inlineStack";
import useSettings from "~/hooks/useSettings";
import Checkbox from "~/components/checkbox";
import Switcher from "~/components/switcher";
import Field from "~/components/field";
import Input from "~/components/input";
import Text from "~/components/text";
import { __ } from "@wordpress/i18n";
import DOCS from "~/constants/docs";

const General = () => {
    const { data, setSettings } = useSettings();

    const { folder, files, svgSupport } = data?.general || {};

    const {
        postTypeFolders,
        forceSorting,
        showFolders,
        showFolderId,
        showCount,
        treeConnector,
    } = folder || {};

    const {
        bulkSelection,
        replaceMedia,
        duplicateMedia,
        moveToTrash,
        controlUploadSize,
        uploadSize,
        controlBigImageSize,
        bigImageSize,
    } = files || {};

    const { uploadSupport, sanitization } = svgSupport || {};

    return (
        <PageContainer>
            <Field
                title={__("Folder", "ninja-media")}
                description={__(
                    "Control how folders are created, displayed, and linked to your post types.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    description={__(
                        "Automatically places new folders in order instead of at the bottom.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Force sorting when adding new folders",
                                "ninja-media",
                            )}
                            checked={forceSorting}
                            onChange={() =>
                                setSettings(
                                    "general.folder.forceSorting",
                                    !forceSorting,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Displays your media folders directly in the WordPress admin sidebar.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Show folders in admin menu",
                                "ninja-media",
                            )}
                            checked={showFolders}
                            onChange={() =>
                                setSettings(
                                    "general.folder.showFolders",
                                    !showFolders,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    statusProps={{ isPro: true, ownUi: false }}
                    background="extralight"
                    description={__(
                        "Displays the folder ID in the file details which can be useful for dynamic folders to identify the folder structure.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Show folder ID", "ninja-media")}
                            isPro={true}
                            checked={showFolderId}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Displays the count in each folder, which can be useful for quickly assessing the number of items in a folder.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Show count in folders", "ninja-media")}
                            checked={showCount}
                            onChange={() =>
                                setSettings(
                                    "general.folder.showCount",
                                    !showCount,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "A UI element that connects parent and child nodes in a tree structure using lines or arrows.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Tree Connector", "ninja-media")}
                            checked={treeConnector}
                            onChange={() =>
                                setSettings(
                                    "general.folder.treeConnector",
                                    !treeConnector,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    title={__("Post Type folders", "ninja-media")}
                    description={__(
                        "Automatically creates folders for each post type in the media library to keep your media organized based on the content types you use.",
                        "ninja-media",
                    )}
                >
                    {pnpnm?.supportedPostTypes?.map((key, index) => (
                        <InlineStack
                            key={key ?? index}
                            gap={10}
                            style={{
                                cursor: "pointer",
                                userSelect: "none",
                            }}
                            onClick={() => {
                            }}
                        >
                            <Checkbox
                                size="small"
                                checked={postTypeFolders?.includes(key)}
                                onChange={() => {
                                }}
                            />

                            <Text size="sm">{key}</Text>
                        </InlineStack>
                    ))}
                </SettingsField>
            </Field>

            <Field
                title={__("Files", "ninja-media")}
                description={__(
                    "Configure file management options including upload limits, media replacement, and deletion behaviour.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    description={__(
                        "Select multiple files at once and drag them into any folder in a single action.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Bulk selection and bulk drag",
                                "ninja-media",
                            )}
                            checked={bulkSelection}
                            onChange={() =>
                                setSettings(
                                    "general.files.bulkSelection",
                                    !bulkSelection,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description={__(
                        "Swap any existing media file with a new version while preserving all post references and attachment IDs.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Replace Media", "ninja-media")}
                            isPro={true}
                            checked={replaceMedia}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description={__(
                        "Create an exact copy of any media file directly from the media library.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Duplicate Media", "ninja-media")}
                            isPro={true}
                            checked={duplicateMedia}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description={__(
                        "Send deleted files to a trash bin so you can review or restore them before they are permanently removed.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Move files to trash before deleting",
                                "ninja-media",
                            )}
                            isPro={true}
                            checked={moveToTrash}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Control the maximum upload file size for the media library. Current server limit: %s MB.",
                        "ninja-media",
                    ).replace("%s", String(pnpnm.maxUploadSize))}
                    action={
                        <Switcher
                            id="controlUploadSize"
                            title={__(
                                "Control maximum upload file size",
                                "ninja-media",
                            )}
                            checked={controlUploadSize}
                            onChange={() =>
                                setSettings(
                                    "general.files.controlUploadSize",
                                    !controlUploadSize,
                                )
                            }
                        />
                    }
                >
                    <SettingsField.SubField
                        background="white"
                        title={__("Maximum upload size", "ninja-media")}
                        description={__(
                            "Set a custom upload size limit in MB. The server allows up to %s MB.",
                            "ninja-media",
                        ).replace("%s", String(pnpnm.maxUploadSize))}
                        depend={!controlUploadSize}
                        dependOn="controlUploadSize"
                        secondaryAction={
                            <Input
                                type="number"
                                size="small"
                                fullWidth={false}
                                customWidth="150px"
                                suffix="MB"
                                value={uploadSize || ""}
                                debounce
                                debounceTime={1000}
                                onChange={(value) =>
                                    setSettings(
                                        "general.files.uploadSize",
                                        Number(value),
                                    )
                                }
                            />
                        }
                    />
                </SettingsField>

                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description={__(
                        "Control WordPress's built-in large image resizing. When enabled, uploaded images exceeding the pixel threshold you set will be automatically scaled down on upload.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            id="controlBigImageSize"
                            title={__(
                                "Scale down large images on upload",
                                "ninja-media",
                            )}
                            isPro={true}
                            checked={controlBigImageSize}
                            onChange={() => {
                            }}
                        />
                    }
                >
                    <SettingsField.SubField
                        background="white"
                        title={__("Big image threshold", "ninja-media")}
                        description={__(
                            "Images with a width or height exceeding this value (in pixels) will be scaled down. WordPress default is 2560.",
                            "ninja-media",
                        )}
                        depend={!controlBigImageSize}
                        dependOn="controlBigImageSize"
                        secondaryAction={
                            <Input
                                type="number"
                                size="small"
                                fullWidth={false}
                                customWidth="150px"
                                suffix="px"
                                value={bigImageSize || ""}
                                onChange={(value) => {
                                }}
                            />
                        }
                    />
                </SettingsField>
            </Field>

            <Field
                title={__("SVG Support", "ninja-media")}
                description={__(
                    "Allow SVG files to be uploaded and automatically sanitized to keep your site secure.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    description={__(
                        "Support for uploading SVG files to the media library. Please note that enabling this option can pose security risks if you upload SVG files from untrusted sources.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("SVG upload support", "ninja-media")}
                            checked={uploadSupport}
                            onChange={() =>
                                setSettings(
                                    "general.svgSupport.uploadSupport",
                                    !uploadSupport,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Automatically clean uploaded SVG files to strip potentially harmful code before they are saved.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Built-in SVG sanitization",
                                "ninja-media",
                            )}
                            checked={sanitization}
                            onChange={() =>
                                setSettings(
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
