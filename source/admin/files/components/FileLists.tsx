import { useContextMenu } from "~/components/contextMenu/ContextMenu";
import SkeletonLoader from "~/components/skeletonLoader";
import { formatFileSize } from "~/utils/functions";
import InlineStack from "~/components/inlineStack";
import { useViewDetails } from "./FileDetails";
import useSettings from "~/hooks/useSettings";
import { useParams } from "react-router-dom";
import Checkbox from "~/components/checkbox";
import FileLocations from "./FileLocations";
import Avatar from "~/components/avatar";
import { useDeleteFile } from "./Delete";
import Button from "~/components/button";
import useFile from "../hooks/useFile";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";
import { File } from "~/types/file";
import clsx from "clsx";

const FileLists = ({
    loading,
    loadMore,
}: {
    loading: boolean;
    loadMore?: boolean;
}) => {
    const { data } = useSettings();
    const { setFile, files, selectedFiles, hiddenFileIds, query, bulkSelect } =
        useFile();
    const HEADER = [
        { key: "NAME", label: __("NAME", "ninja-media") },
        { key: "TYPE", label: __("TYPE", "ninja-media") },
        { key: "SIZE", label: __("SIZE", "ninja-media") },
        { key: "LOCATION", label: __("LOCATION", "ninja-media") },
        { key: "DATE", label: __("DATE", "ninja-media") },
        { key: "ACTION", label: __("ACTION", "ninja-media") },
    ];
    const FLEX_VALUES = ["5", "1.3", "1.3", "1.3", "1.5", "1.3"];

    const { openViewDetails } = useViewDetails();
    const { openDeleteFile } = useDeleteFile();

    const { menuKey } = useParams();

    const { show } = useContextMenu();

    const handleSelect = (file: File) => {
        if (!bulkSelect) {
            setFile("detailsFile", file);
            openViewDetails();
            return;
        }

        const isExist = selectedFiles?.find((f) => f?.id === file?.id);

        const newSelectedFiles = isExist
            ? selectedFiles?.filter((f) => f?.id !== file?.id)
            : [...(selectedFiles ?? []), file];

        setFile("selectedFiles", newSelectedFiles);
    };

    const enableTrash = data?.general?.files?.moveToTrash ?? false;

    if (!loading && files?.length === 0) return null;

    return (
        <div>
            <Card padding={0} background="white" rounded="md">
                <InlineStack
                    className={clsx(
                        "pnpnm-file-list-header",
                        (files?.length > 0 || loading) &&
                            "pnpnm-file-list-header--active",
                    )}
                >
                    {HEADER?.map(({ key, label }, index) => (
                        <InlineStack
                            key={key}
                            gap={10}
                            align={
                                key === "NAME"
                                    ? "start"
                                    : key === "ACTION"
                                    ? "end"
                                    : "center"
                            }
                            style={{
                                flex: FLEX_VALUES[index],
                                minWidth: 0,
                            }}
                        >
                            <Text
                                color="descgray"
                                size="sm"
                                wrap={false}
                                ellipsis
                            >
                                {label}
                            </Text>
                        </InlineStack>
                    ))}
                </InlineStack>

                {loading ? (
                    <SkeletonLoader.SkeletonFile
                        variant="list"
                        length={query?.perPage}
                    />
                ) : (
                    files?.map((file, index) => {
                        const isSelected = selectedFiles?.find(
                            (f) => f?.id === file?.id,
                        );

                        const ids = bulkSelect
                            ? selectedFiles?.length > 0
                                ? selectedFiles?.map((f) => f?.id) ?? []
                                : [file?.id]
                            : [file?.id];

                        if (hiddenFileIds?.includes(file?.id)) return null;

                        return (
                            <InlineStack
                                key={file?.id ?? index}
                                data-file-id={file?.id}
                                style={{
                                    cursor: "pointer",
                                    opacity: bulkSelect
                                        ? isSelected
                                            ? 1
                                            : 0.5
                                        : 1,
                                }}
                                className="pnpnm-file-list-item"
                                onClick={() => handleSelect(file)}
                                onDoubleClick={() => {
                                    setFile("detailsFile", file);
                                    openViewDetails();
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    show(
                                        "file-menu",
                                        e as React.MouseEvent<HTMLElement>,
                                        {
                                            files: bulkSelect
                                                ? selectedFiles?.length > 0
                                                    ? selectedFiles
                                                    : [file]
                                                : [file],
                                        },
                                    );
                                }}
                            >
                                <InlineStack
                                    gap={10}
                                    wrap={false}
                                    style={{
                                        flex: FLEX_VALUES[0],
                                        minWidth: 0,
                                    }}
                                >
                                    <Card
                                        padding={0}
                                        rounded="sm"
                                        style={{
                                            position: "relative",
                                            width: "50px",
                                            height: "40px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Avatar
                                            src={`${file?.url}?v=${file?.updatedAt}`}
                                            alt={file?.name}
                                            width="100%"
                                            height="100%"
                                            rounded="sm"
                                            showSpinner
                                        />

                                        {bulkSelect && (
                                            <Checkbox
                                                rounded="sm"
                                                checked={!!isSelected}
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform:
                                                        "translate(-50%, -50%)",
                                                }}
                                                onChange={() =>
                                                    handleSelect(file)
                                                }
                                            />
                                        )}
                                    </Card>

                                    <Text
                                        size="sm"
                                        wrap={false}
                                        ellipsis
                                        style={{
                                            minWidth: 0,
                                        }}
                                    >
                                        {file?.name}
                                    </Text>
                                </InlineStack>

                                <Text
                                    color="descgray"
                                    size="xs"
                                    textTransform="uppercase"
                                    align="center"
                                    wrap={false}
                                    style={{
                                        flex: FLEX_VALUES[1],
                                    }}
                                >
                                    {file?.extension}
                                </Text>

                                <Text
                                    color="descgray"
                                    size="xs"
                                    align="center"
                                    wrap={false}
                                    ellipsis
                                    style={{
                                        flex: FLEX_VALUES[2],
                                    }}
                                >
                                    {formatFileSize(file?.size || 0)}
                                </Text>

                                <FileLocations
                                    FLEX_VALUES={FLEX_VALUES}
                                    location={file?.location}
                                />

                                <Text
                                    color="descgray"
                                    size="xs"
                                    align="center"
                                    wrap={false}
                                    ellipsis
                                    style={{
                                        flex: FLEX_VALUES[4],
                                    }}
                                >
                                    {file?.createdAt}
                                </Text>

                                <InlineStack
                                    align="end"
                                    style={{
                                        flex: FLEX_VALUES[5],
                                    }}
                                >
                                    {enableTrash && menuKey !== "trash" ? (
                                        <Button
                                            variant="error"
                                            size="supersmall"
                                            startIcon="recycling"
                                            statusProps={{
                                                isPro: true,
                                                size: "extrasmall",
                                                placement: "right-center",
                                                right: 1,
                                            }}
                                            onClick={() => {
                                            }}
                                        >
                                            Trash
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="error"
                                            size="supersmall"
                                            startIcon="delete"
                                            onClick={() => openDeleteFile(ids)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </InlineStack>
                            </InlineStack>
                        );
                    })
                )}

                {loadMore && (
                    <SkeletonLoader.SkeletonFile
                        variant="list"
                        length={query?.perPage}
                    />
                )}
            </Card>
        </div>
    );
};

export default FileLists;
