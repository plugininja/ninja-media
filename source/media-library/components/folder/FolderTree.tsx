import { useFolderDragContext } from "../context/FolderDragContext";
import { useEffect, useLayoutEffect } from "@wordpress/element";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import SkeletonLoader from "~/components/skeletonLoader";
import { useGetFoldersQuery } from "~/redux/api/media";
import useScrollFade from "~/hooks/useScrollFade";
import GapDropZone from "../context/GapDropZone";
import BlockStack from "~/components/blockStack";
import FolderTreeNode from "./FolderTreeNode";
import CreateFolder from "../actions/Create";
import Button from "~/components/button";
import { Folder } from "~/types/media";
import Text from "~/components/text";
import clsx from "clsx";
import {
    selectMedia,
    setAllFiles,
    setCreateFolder,
    setDynamicFolders,
    setFolders,
    setLoading,
    setTrash,
    setUncategorized,
} from "~/redux/features/media";

const FolderTree = () => {
    const { data: dashBoardData } = useAppSelector(selectSettings);
    const {
        folders,
        activeFolder,
        createFolder,
        cutFolders,
        folderSorting,
        order,
        search,
    } = useAppSelector(selectMedia);
    const { data, isLoading, isFetching } = useGetFoldersQuery({
        orderBy: folderSorting?.orderBy,
        order: order,
        search: search,
    });

    const { ref, showFade, checkFade } = useScrollFade();

    const { isFolderDragging, draggedFolderId, onGapDrop } =
        useFolderDragContext();

    const dispatch = useAppDispatch();

    const allFolders = folders["root"] ?? null;

    const theme =
        dashBoardData?.display?.theme?.theme ??
        pnpnm?.settings?.display?.theme?.theme ??
        "default";

    const loading = isLoading || isFetching;

    useEffect(() => {
        dispatch(setLoading(loading));
        dispatch(setAllFiles(data?.data?.allFiles ?? 0));
        dispatch(setUncategorized(data?.data?.uncategorized ?? 0));
        dispatch(setDynamicFolders(data?.data?.dynamicFolders ?? {}));
        dispatch(setTrash(data?.data?.trashed ?? 0));

        if (data?.data?.folders) {
            dispatch(
                setFolders({ parentId: "root", children: data.data.folders }),
            );
        }
    }, [data, loading]);

    useLayoutEffect(() => {
        requestAnimationFrame(checkFade);
    }, [data]);

    const handleAddFolder = (folder: Folder) => {
        dispatch(
            setFolders({
                parentId: "root",
                children: [folder, ...(allFolders ?? [])],
            }),
        );
    };

    if (
        !loading &&
        data?.data?.totalFolders === 0 &&
        !createFolder?.create &&
        allFolders?.length === 0
    ) {
        return (
            <BlockStack
                align="center"
                inlineAlign="center"
                gap={10}
                marginTop={20}
            >
                <Text weight="medium" align="center">
                    Add your first folder
                </Text>

                <Text color="descgray" size="xs" align="center">
                    You don't have any folder. Add folder to easily manage your
                    files.
                </Text>

                <Button
                    variant="primary"
                    size="extrasmall"
                    startIcon="create_new_folder"
                    onClick={() =>
                        dispatch(
                            setCreateFolder({ create: true, folder: null }),
                        )
                    }
                >
                    Add Folder
                </Button>
            </BlockStack>
        );
    }

    if (!loading && allFolders?.length === 0 && !createFolder?.create) {
        return (
            <BlockStack
                align="center"
                inlineAlign="center"
                gap={10}
                marginTop={20}
            >
                <Text weight="medium" align="center">
                    Folder not found
                </Text>

                <Text color="descgray" size="xs" align="center">
                    We couldn't find any folder. Try adjusting your search or
                    create a new folder.
                </Text>
            </BlockStack>
        );
    }

    return (
        <div className={clsx("pnpnm-folder-tree")}>
            <div
                ref={ref}
                onScroll={checkFade}
                className="pnpnm-folder-tree__list"
            >
                {!activeFolder && createFolder?.create && (
                    <CreateFolder theme={theme} setFolder={handleAddFolder} />
                )}

                {loading ? (
                    <BlockStack
                        gap={5}
                        style={{
                            marginTop: 5,
                        }}
                    >
                        {Array?.from({ length: 30 })?.map((_, index) => (
                            <SkeletonLoader.SkeletonFolder
                                key={index}
                                theme={theme}
                            />
                        ))}
                    </BlockStack>
                ) : (
                    allFolders?.map((folder, index) => {
                        const isCutFolder =
                            cutFolders?.cut &&
                            cutFolders?.folders?.some(
                                (cutFolder) => cutFolder?.id === folder?.id,
                            );

                        if (isCutFolder) return null;

                        return (
                            <div key={folder?.id ?? index}>
                                <GapDropZone
                                    isFolderDragging={isFolderDragging}
                                    draggedFolderId={draggedFolderId}
                                    onGapDrop={(targetId) =>
                                        onGapDrop?.(
                                            targetId,
                                            draggedFolderId!,
                                            folder?.id!,
                                        )
                                    }
                                />

                                <FolderTreeNode
                                    folder={folder}
                                    paddingLeft={0}
                                    parentId="root"
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {showFade && <div className="pnpnm-folder-tree--fade" />}
        </div>
    );
};

export default FolderTree;
