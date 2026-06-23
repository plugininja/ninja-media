import ThumbnailGenerator from "./components/ThumbnailGenerator";
import PageContainer from "~/components/pageContainer";
import SettingsField from "~/components/settingsField";
import useSettings from "~/hooks/useSettings";
import Switcher from "~/components/switcher";
import Field from "~/components/field";
import Input from "~/components/input";
import { __ } from "@wordpress/i18n";
import DOCS from "~/constants/docs";
import Status from "~/components/status";

const Advanced = () => {
    const { data, setSettings } = useSettings();

    const { action, organization, imageProcessing } = data?.advanced || {};

    const { contextMenu, undoActions } = action || {};

    const { dynamicFolders, uncategorized, favorites, used, unused } =
        organization || {};

    const { convertWebp, thumbnailGenerator, defaultFeaturedImage } =
        imageProcessing || {};

    return (
        <PageContainer>
            <Field
                title={__("Actions", "ninja-media")}
                description={__(
                    "Control interactive behaviours such as the context menu and undo prompts.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    background="extralight"
                    description={__(
                        "Enable or disable the context menu in the media library.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Enable context menu", "ninja-media")}
                            checked={contextMenu}
                            onChange={() =>
                                setSettings(
                                    "advanced.action.contextMenu",
                                    !contextMenu,
                                )
                            }
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Show a temporary undo prompt after deleting a folder, giving you a few seconds to reverse the action.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Undo after folder delete",
                                "ninja-media",
                            )}
                            checked={undoActions}
                            onChange={() =>
                                setSettings(
                                    "advanced.action.undoActions",
                                    !undoActions,
                                )
                            }
                        />
                    }
                />
            </Field>

            <Field
                title={__("Organization", "ninja-media")}
                description={__(
                    "Set up dynamic folders, uncategorized grouping, and automatic upload sorting to keep your library tidy.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description={__(
                        "Add smart virtual folders that group media automatically by type, date, or other criteria — no manual sorting needed.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Dynamic folders", "ninja-media")}
                            isPro={true}
                            checked={dynamicFolders}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Collect all files that haven't been assigned to any folder into a dedicated Uncategorized group.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Group uncategorized files",
                                "ninja-media",
                            )}
                            checked={uncategorized}
                            onChange={() =>
                                setSettings(
                                    "advanced.organization.uncategorized",
                                    !uncategorized,
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
                        "Mark your favorite media files for quick access and easy organization.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Mark as favorite", "ninja-media")}
                            isPro={true}
                            checked={favorites}
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
                        "Identify media files that are no longer attached to any post or page and collect them into a Used Files folder.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Used files", "ninja-media")}
                            isPro={true}
                            checked={used}
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
                        "Identify media files that are no longer attached to any post or page and collect them into an Unused Files folder.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__("Unused files", "ninja-media")}
                            isPro={true}
                            checked={unused}
                            onChange={() => {
                            }}
                        />
                    }
                />
            </Field>

            <Field
                title={__("Image Processing", "ninja-media")}
                description={__(
                    "Control how images are processed when uploaded to the media library.",
                    "ninja-media",
                )}
                docLink={DOCS?.documentation?.main}
            >
                <SettingsField
                    statusProps={{
                        isPro: true,
                        ownUi: false,
                    }}
                    background="extralight"
                    description={__(
                        "Automatically convert uploaded images to WebP format to reduce file size and improve page load speed.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            title={__(
                                "Convert to WebP on upload",
                                "ninja-media",
                            )}
                            isPro={true}
                            checked={convertWebp}
                            onChange={() => {
                            }}
                        />
                    }
                />

                <SettingsField
                    background="extralight"
                    description={__(
                        "Automatically generate all registered thumbnail sizes when a new image is uploaded.",
                        "ninja-media",
                    )}
                    action={
                        <Switcher
                            id="thumbnailGenerator"
                            title={__("Thumbnail generator", "ninja-media")}
                            checked={thumbnailGenerator}
                            onChange={() =>
                                setSettings(
                                    "advanced.imageProcessing.thumbnailGenerator",
                                    !thumbnailGenerator,
                                )
                            }
                        />
                    }
                >
                    <SettingsField.SubField
                        depend={!thumbnailGenerator}
                        dependOn="thumbnailGenerator"
                        title={__(
                            "Regenerate Existing Thumbnails",
                            "ninja-media",
                        )}
                        description={__(
                            "Regenerate all thumbnail sizes for images already in your media library. Large libraries may take a moment — processing happens in small batches.",
                            "ninja-media",
                        )}
                        secondaryAction={<ThumbnailGenerator />}
                    />
                </SettingsField>

                <SettingsField
                    background="extralight"
                    description={
                        <>
                            {__(
                                "Show a fallback image on any post or page that has no featured image set. Choose the image in ",
                                "ninja-media",
                            )}
                            <a
                                href={pnpnm.ajaxUrl.replace(
                                    "admin-ajax.php",
                                    "options-media.php",
                                )}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "var(--pnpnm-primary)" }}
                            >
                                {__("WP Settings → Media", "ninja-media")}
                            </a>
                            {"."}
                        </>
                    }
                    action={
                        <Switcher
                            title={__(
                                "Default featured image",
                                "ninja-media",
                            )}
                            checked={defaultFeaturedImage}
                            onChange={() =>
                                setSettings(
                                    "advanced.imageProcessing.defaultFeaturedImage",
                                    !defaultFeaturedImage,
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
