import { selectFiles, setSelectedFiles } from "~/redux/features/files";
import { useContextMenu } from "~/components/contextMenu/ContextMenu";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import SkeletonLoader from "~/components/skeletonLoader";
import useFileActions from "~/hooks/useFileActions";
import { formatFileSize } from "~/utils/functions";
import InlineStack from "~/components/inlineStack";
import { useParams } from "react-router-dom";
import Checkbox from "~/components/checkbox";
import FileLocations from "./FileLocations";
import Avatar from "~/components/avatar";
import { useDeleteFile } from "./Delete";
import Button from "~/components/button";
import Card from "~/components/card";
import Text from "~/components/text";
import { File } from "~/types/files";
import clsx from "clsx";

const FileLists = ({
    loading,
    loadMore,
}: {
    loading: boolean;
    loadMore?: boolean;
}) => {
    const { data } = useAppSelector(selectSettings);
    const { files, selectedFiles, hiddenFileIds, query, bulkSelect } =
        useAppSelector(selectFiles);
    const HEADER = ["NAME", "TYPE", "SIZE", "LOCATION", "DATE", "ACTION"];
    const FLEX_VALUES = ["5", "1.3", "1.3", "1.3", "1.5", "1.3"];

    const { trashFile } = useFileActions();
    const { openDeleteFile } = useDeleteFile();

    const { menuKey } = useParams();

    const dispatch = useAppDispatch();

    const { show } = useContextMenu();

    const handleSelect = (file: File) => {
        if (!bulkSelect) return;

        const isExist = selectedFiles?.find((f) => f?.id === file?.id);

        const newSelectedFiles = isExist
            ? selectedFiles?.filter((f) => f?.id !== file?.id)
            : [...(selectedFiles ?? []), file];

        dispatch(setSelectedFiles(newSelectedFiles));
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
                    {HEADER?.map((header, index) => (
                        <InlineStack
                            key={header ?? index}
                            gap={10}
                            align={
                                header === "NAME"
                                    ? "start"
                                    : header === "ACTION"
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
                                {header}
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
                                    cursor: bulkSelect ? "pointer" : "default",
                                    opacity: bulkSelect
                                        ? isSelected
                                            ? 1
                                            : 0.5
                                        : 1,
                                }}
                                className="pnpnm-file-list-item"
                                onClick={() => handleSelect(file)}
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
                                            src={file?.url}
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
                                            onClick={() => trashFile(ids)}
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
