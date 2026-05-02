import { useContextMenu } from "~/components/contextMenu/ContextMenu";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { formatFileSize } from "~/utils/functions";
import InlineStack from "~/components/inlineStack";
import { File as FileType } from "~/types/files";
import BlockStack from "~/components/blockStack";
import Checkbox from "~/components/checkbox";
import Avatar from "~/components/avatar";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";

import {
    selectFiles,
    setDetailsFile,
    setSelectedFiles,
} from "~/redux/features/files";

const File = ({ file }: { file: FileType }) => {
    const { selectedFiles, hiddenFileIds, detailsFile, bulkSelect } =
        useAppSelector(selectFiles);

    const dispatch = useAppDispatch();

    const { show } = useContextMenu();

    const { id, name, url, extension, size } = file || {};

    const isSelected = selectedFiles?.find((f) => f?.id === id);

    const handleSelect = () => {
        if (!bulkSelect) {
            if (detailsFile?.id === id) {
                dispatch(setDetailsFile(null));
            } else {
                dispatch(setDetailsFile(file));
            }
            return;
        }

        const isExist = selectedFiles?.find((f) => f?.id === id);

        const newSelectedFiles = isExist
            ? selectedFiles?.filter((f) => f?.id !== id)
            : [...(selectedFiles ?? []), file];

        dispatch(setSelectedFiles(newSelectedFiles));
    };

    if (hiddenFileIds?.includes(id)) return null;

    return (
        <Card
            data-file-id={id}
            padding={10}
            background="white"
            rounded="md"
            flex
            direction="col"
            gap={10}
            style={{
                cursor: "pointer",
                opacity: bulkSelect ? (isSelected ? 1 : 0.5) : 1,
                transition: "opacity 0.2s ease",
            }}
            className="pnpnm-fade-in"
            onClick={handleSelect}
            onContextMenu={(event) => {
                event.preventDefault();
                show("file-menu", event as React.MouseEvent<HTMLElement>, {
                    files: bulkSelect
                        ? selectedFiles?.length > 0
                            ? selectedFiles
                            : [file]
                        : [file],
                });
            }}
        >
            <BlockStack
                style={{ position: "relative", height: "150px" }}
                className="bg-extralight rounded-sm border border-solid border-light"
            >
                {bulkSelect && (
                    <Checkbox
                        rounded="sm"
                        style={{ position: "absolute", top: 10, left: 10 }}
                        checked={!!isSelected}
                        onChange={handleSelect}
                    />
                )}

                <Avatar
                    src={url}
                    alt={name}
                    width="100%"
                    height="100%"
                    rounded="sm"
                    showSpinner
                />
            </BlockStack>

            <BlockStack gap={5}>
                <Text size="sm" wrap={false} ellipsis>
                    {name}
                </Text>

                <InlineStack align="between" gap={10} wrap={false}>
                    <InlineStack
                        gap={10}
                        wrap={false}
                        style={{
                            minWidth: 0,
                        }}
                    >
                        <Text
                            color="descgray"
                            size="xs"
                            textTransform="uppercase"
                            wrap={false}
                        >
                            {extension}
                        </Text>

                        <Text
                            color="descgray"
                            size="xs"
                            wrap={false}
                            ellipsis
                            style={{
                                minWidth: 0,
                            }}
                        >
                            {formatFileSize(size || 0)}
                        </Text>
                    </InlineStack>

                    <Icon
                        name="more_vert"
                        color="descgray"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            show(
                                "file-menu",
                                event as React.MouseEvent<HTMLElement>,
                                {
                                    files: bulkSelect
                                        ? selectedFiles?.length > 0
                                            ? selectedFiles
                                            : [file]
                                        : [file],
                                },
                            );
                        }}
                    />
                </InlineStack>
            </BlockStack>
        </Card>
    );
};

export default File;
