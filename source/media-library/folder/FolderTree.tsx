import { useFolderDragContext } from "~/shared/context/FolderDragContext";
import { memo, useEffect, useLayoutEffect, useRef } from "@wordpress/element";
import { setFolders } from "~/redux/features/media/media";
import SkeletonLoader from "~/components/skeletonLoader";
import { useGetFoldersQuery, useLazyGetFolderQuery } from "~/redux/api/media";
import GapDropZone from "~/shared/context/GapDropZone";
import useScrollFade from "~/hooks/useScrollFade";
import BlockStack from "~/components/blockStack";
import { useAppDispatch } from "~/redux/hooks";
import { iconNotFound } from "~/utils/icons";
import FolderTreeNode from "./FolderTreeNode";
import useSettings from "~/hooks/useSettings";
import useMedia from "../hooks/useMedia";
import Button from "~/components/button";
import { Folder } from "~/types/folder";
import Create from "../actions/Create";
import Text from "~/components/text";
import clsx from "clsx";

const LS_KEY = "pnpnm-active-folder-id";

const FolderTree = () => {
    const { data: dashBoardData } = useSettings();
    const {
        setMedia,
        folders,
        activeFolder,
        createFolder,
        cutFolders,
        folderSorting,
        order,
        search,
    } = useMedia();

    const { data, isLoading, isFetching } = useGetFoldersQuery({
        orderBy: folderSorting?.orderBy,
        order: order,
        search: search,
    });

    const [getFolder] = useLazyGetFolderQuery();

    const { ref, showFade, checkFade } = useScrollFade();

    const { isFolderDragging, draggedFolderId, onRootDrop } =
        useFolderDragContext();

    const dispatch = useAppDispatch();

    const allFolders = folders["root"] ?? null;
    const hasRestoredRef = useRef(false);

    const theme =
        dashBoardData?.display?.theme?.theme ??
        pnpnm?.settings?.display?.theme?.theme ??
        "default";

    const loading = isLoading || isFetching;

    useEffect(() => {
        if (!hasRestoredRef.current) return;

        if (activeFolder) {
            localStorage.setItem(LS_KEY, String(activeFolder.id));
        } else {
            localStorage.removeItem(LS_KEY);
        }
    }, [activeFolder]);

    useEffect(() => {
        if (loading || hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        if (activeFolder) return;

        const savedId = localStorage.getItem(LS_KEY);
        if (!savedId) return;

        getFolder({ id: savedId })
            .unwrap()
            .then((res) => {
                const folder = res?.data?.currentFolder;
                if (!folder) return;
                setMedia("activeFolder", folder);
                window.pnpnmMedia?.initFilter([folder]);
                window.pnpnmMedia?.setFolderFilter(savedId);
            })
            .catch(() => {
                localStorage.removeItem(LS_KEY);
            });
    }, [loading]);

    useEffect(() => {
        setMedia("loading", loading);
        setMedia("allFiles", data?.data?.allFiles ?? 0);
        setMedia("uncategorized", data?.data?.uncategorized ?? 0);
        setMedia("dynamicFolders", data?.data?.dynamicFolders ?? {});
        setMedia("favorites", data?.data?.favorites ?? 0);
        setMedia("used", data?.data?.used ?? 0);
        setMedia("unused", data?.data?.unused ?? 0);
        setMedia("trash", data?.data?.trashed ?? 0);

        if (data?.data?.folders) {
            dispatch(setFolders({ id: "root", children: data.data.folders }));
        }
    }, [data, loading]);

    useLayoutEffect(() => {
        requestAnimationFrame(checkFade);
    }, [data]);

    const handleAddFolder = (folder: Folder) => {
        dispatch(
            setFolders({
                id: "root",
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
                <img src={iconNotFound} alt="" />

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
                        setMedia("createFolder", { create: true, folder: null })
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
                <img src={iconNotFound} alt="" />

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
                    <Create theme={theme} setFolder={handleAddFolder} />
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
                                        onRootDrop?.({
                                            targetId,
                                            draggedId: draggedFolderId!,
                                            folderId: folder?.id!,
                                        })
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

export default memo(FolderTree);
