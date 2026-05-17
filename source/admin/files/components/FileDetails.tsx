import { useCustomAlert } from "~/components/alert/Alert";
import useFileActions from "../hooks/useFileActions";
import { formatFileSize } from "~/utils/functions";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import Tooltip from "~/components/tooltip";
import { useDeleteFile } from "./Delete";
import Avatar from "~/components/avatar";
import useFile from "../hooks/useFile";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";
import Icon from "~/components/icon";
import { File } from "~/types/file";

const FileDetails = ({ onClose }: { onClose: () => void }) => {
    const { setFile, detailsFile } = useFile();

    const {
        getFileLink,
    } = useFileActions();

    const { openDeleteFile } = useDeleteFile();

    const { id, name, url, extension, size, location, createdAt, updatedAt } =
        detailsFile || {};

    const handleClose = () => {
        setFile("detailsFile", null);
        onClose();
    };

    return (
        <Card padding={0} background="white" borderStyle="none" rounded="md">
            <InlineStack align="between" gap={10}>
                <Text size="sm">
                    {__("Media Details", "ninja-media")} {id}
                </Text>

                <IconButton
                    variant="error"
                    size="microsmall"
                    name="close"
                    style={{
                        borderRadius: "5px",
                    }}
                    onClick={handleClose}
                />
            </InlineStack>

            <Card
                marginTop={15}
                padding={0}
                background="extralight"
                rounded="md"
                style={{
                    height: "300px",
                }}
            >
                <Avatar
                    src={`${url}?v=${updatedAt}`}
                    alt={name}
                    width="100%"
                    height="100%"
                    rounded="md"
                    objectFit="contain"
                    showSpinner
                />
            </Card>

            <InlineStack gap={20} wrap={false}>
                <BlockStack marginTop={10} gap={5}>
                    <Text size="sm">{__("Name:", "ninja-media")}</Text>

                    <Text size="sm">{__("Type:", "ninja-media")}</Text>

                    <Text size="sm">{__("Size:", "ninja-media")}</Text>

                    <Text size="sm">{__("Date:", "ninja-media")}</Text>
                </BlockStack>

                <BlockStack
                    marginTop={10}
                    gap={5}
                    style={{
                        minWidth: 0,
                    }}
                >
                    <Text
                        color="descgray"
                        size="sm"
                        wrap={false}
                        ellipsis
                        style={{
                            minWidth: 0,
                        }}
                    >
                        {name}
                    </Text>

                    <Text color="descgray" size="sm">
                        {extension}
                    </Text>

                    <Text color="descgray" size="sm">
                        {formatFileSize(size ?? 0)}
                    </Text>

                    <Text color="descgray" size="sm">
                        {createdAt}
                    </Text>
                </BlockStack>
            </InlineStack>

            <BlockStack marginTop={20} gap={location?.length === 0 ? 0 : 10}>
                <Text size="sm">
                    {location?.length === 0
                        ? __("Location not Found", "ninja-media")
                        : __("Location:", "ninja-media")}
                </Text>

                <BlockStack
                    gap={5}
                    style={{
                        marginLeft: 10,
                    }}
                >
                    {location?.map(({ name, url }, index) => (
                        <InlineStack key={index} gap={10} wrap={false}>
                            <Text color="descgray" size="sm" wrap={false}>
                                {index + 1}.
                            </Text>

                            <Text color="descgray" size="sm" wrap={false}>
                                {name}
                            </Text>

                            <Icon
                                name="open_in_new"
                                color="primary"
                                style={{
                                    cursor: "pointer",
                                }}
                                onClick={() => window.open(url, "_blank")}
                            />
                        </InlineStack>
                    ))}
                </BlockStack>
            </BlockStack>

            <InlineStack marginTop={20} gap={15} align="end">
                <Tooltip
                    title={
                        pnpnm?.isPro
                            ? __("Download", "ninja-media")
                            : __("Premium Only", "ninja-media")
                    }
                    arrow
                    wrap="no-wrap"
                >
                    <Icon
                        name="download"
                        color="primary"
                        fontSize="2xl"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() => {
                        }}
                    />
                </Tooltip>

                <Tooltip
                    title={__("Copy URL", "ninja-media")}
                    arrow
                    wrap="no-wrap"
                >
                    <Icon
                        name="link"
                        color="primary"
                        fontSize="2xl"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() => getFileLink(detailsFile as File)}
                    />
                </Tooltip>

                <Tooltip
                    title={__("Open in Media Library", "ninja-media")}
                    arrow
                    wrap="no-wrap"
                >
                    <Icon
                        name="open_in_new"
                        color="primary"
                        fontSize="xl"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            window.open(
                                `${pnpnm?.siteUrl}/wp-admin/upload.php?item=${id}`,
                                "_blank",
                            )
                        }
                    />
                </Tooltip>

                {detailsFile?.location?.length === 0 && (
                    <Tooltip
                        title={__("Delete", "ninja-media")}
                        arrow
                        wrap="no-wrap"
                    >
                        <Icon
                            name="delete"
                            color="error"
                            fontSize="xl"
                            style={{
                                cursor: "pointer",
                            }}
                            onClick={() => openDeleteFile([Number(id)])}
                        />
                    </Tooltip>
                )}
            </InlineStack>
        </Card>
    );
};

export const useViewDetails = () => {
    const { showAlert, closeAlert } = useCustomAlert();

    const openViewDetails = () => {
        showAlert({
            id: "view-details-modal",
            type: "info",
            showIcon: false,
            showConfirmButton: false,
            allowEscapeKey: false,
            width: "600px",
            height: "fit-content",
            html: (
                <FileDetails onClose={() => closeAlert("view-details-modal")} />
            ),
        });
    };

    return { openViewDetails };
};
