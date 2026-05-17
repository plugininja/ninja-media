import { useDeleteFolder } from "~/media-library/actions/Delete";
import useDisabled from "~/media-library/hooks/useDisabled";
import useMedia from "~/media-library/hooks/useMedia";
import InlineStack from "~/components/inlineStack";
import Sorting from "~/shared/topbar/Sorting";
import Button from "~/components/button";
import More from "~/shared/topbar/More";
import Card from "~/components/card";

const Controls = () => {
    const {
        setMedia,
        activeFolder,
        renameFolder,
        folderSorting,
        fileSorting,
        order,
        bulkSelect,
        expandAll,
    } = useMedia();

    const { openDeleteFolder } = useDeleteFolder();

    const {
        renameFolderDisabled,
        deleteFolderDisabled,
        sortingDisabled,
        moreOptionsDisabled,
    } = useDisabled();

    return (
        <Card
            marginTop={20}
            padding={5}
            background="white"
            rounded="sm"
            border="light"
            flex
            direction="row"
            align="between"
            gap={5}
            wrap={false}
        >
            <InlineStack gap={5} wrap={false}>
                <Button
                    variant="primary"
                    size="extrasmall"
                    rounded="xs"
                    startIcon="edit_document"
                    onClick={() => {
                        setMedia("renameFolder", {
                            rename: !renameFolder?.rename,
                            folder: activeFolder,
                        });
                    }}
                    disabled={renameFolderDisabled}
                >
                    Rename
                </Button>

                <Button
                    variant="error"
                    size="extrasmall"
                    rounded="xs"
                    startIcon="delete"
                    onClick={() => openDeleteFolder(String(activeFolder?.id))}
                    disabled={deleteFolderDisabled}
                >
                    Delete
                </Button>
            </InlineStack>

            <InlineStack gap={5} wrap={false}>
                <Sorting
                    folderSorting={folderSorting}
                    fileSorting={fileSorting}
                    order={order}
                    onFolderSorting={(sorting) =>
                        setMedia("folderSorting", sorting)
                    }
                    onFileSorting={(sorting) =>
                        setMedia("fileSorting", sorting)
                    }
                    onOrder={(order) => setMedia("order", order)}
                    disabled={sortingDisabled}
                />

                <More
                    bulkSelect={bulkSelect}
                    expandAll={expandAll}
                    onSelectedFolders={() => setMedia("selectedFolders", [])}
                    onBulkSelect={(value) => setMedia("bulkSelect", value)}
                    onExpandAll={(value) => setMedia("expandAll", value)}
                    disabled={moreOptionsDisabled}
                />
            </InlineStack>
        </Card>
    );
};

export default Controls;
