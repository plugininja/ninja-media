import { useContextMenu } from "~/components/contextMenu/ContextMenu";
import { useFolderDragContext } from "../context/FolderDragContext";
import { useFolderAutoScroll } from "~/hooks/useFolderAutoScroll";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import { useCustomAlert } from "~/components/alert/Alert";
import { useLazyGetFolderQuery } from "~/redux/api/media";
import { useEffect, useState } from "@wordpress/element";
import SkeletonLoader from "~/components/skeletonLoader";
import { useDragContext } from "../context/DragContext";
import useMediaActions from "~/hooks/useMediaActions";
import { Folder as FolderType } from "~/types/media";
import BlockStack from "~/components/blockStack";
import CreateFolder from "../actions/Create";
import RenameFolder from "../actions/Rename";
import { useRef } from "@wordpress/element";
import * as React from "@wordpress/element";
import type { MouseEvent } from "react";
import Folder from "./Folder";
import clsx from "clsx";
import {
    selectMedia,
    setActiveFolder,
    setFolders,
    setLoading,
    setMenu,
    setSelectedFolders,
    updateFolder,
} from "~/redux/features/media";

const FolderTreeNode = ({
    folder,
    paddingLeft = 10,
    parentId,
}: {
    folder: FolderType;
    paddingLeft?: number;
    parentId?: string | number;
}) => {
    const colorRef = useRef<string | null>(folder?.color || null);
    const [color, setColor] = useState<string | null>(folder?.color || null);
    const [folderLoading, setFolderLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [getFolder, { isLoading }] = useLazyGetFolderQuery();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { isDragging, hoveredFolderId } = useDragContext();
    const isInitialLoad = useRef(true);
    const {
        isFolderDragging,
        hoveredFolderId: folderHoveredId,
        draggedFolderId,
        startFolderDrag,
    } = useFolderDragContext();

    const { colorUpdate } = useMediaActions();

    const dispatch = useAppDispatch();

    const { show } = useContextMenu();

    const { showAlert } = useCustomAlert();

    const { scrollToFolder } = useFolderAutoScroll();

    const { data } = useAppSelector(selectSettings);

    const {
        folders,
        expandedFolderIds,
        selectedFolders,
        hiddenFolderIds,
        activeFolder,
        createFolder,
        renameFolder,
        cutFolders,
        moveFolder,
        bulkSelect,
        expandAll,
    } = useAppSelector(selectMedia);

    const { id } = folder || {};

    const latestFolder =
        folders[parentId || "root"]?.find((f) => String(f.id) === String(id)) ||
        folder;

    const { name, attachmentCount, childFolders } = latestFolder || {};

    const children = folders[id ?? ""] ?? null;

    useEffect(() => {
        dispatch(setLoading(isLoading));
    }, [isLoading]);

    useEffect(() => {
        if (paddingLeft === 0) {
            setIsExpanded(expandAll);
        }
    }, [expandAll]);

    useEffect(() => {
        if (paddingLeft !== 0) return;
        if (!expandAll) return;
        if (children) return;

        getFolder({ id: id ?? "" })
            .unwrap()
            .then((response) => {
                dispatch(
                    setFolders({
                        parentId: id ?? "",
                        children: response?.data?.folders ?? [],
                    }),
                );
            })
            .catch(() => {});
    }, [expandAll]);

    useEffect(() => {
        if (!expandedFolderIds?.includes(String(id))) return;

        setIsExpanded(true);

        if (!children) {
            getFolder({ id: id ?? "" })
                .unwrap()
                .then((response) => {
                    dispatch(
                        setFolders({
                            parentId: id ?? "",
                            children: response?.data?.folders ?? [],
                        }),
                    );
                })
                .catch(() => {});
        }

        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            dispatch(setActiveFolder(folder));
        }

        const index = expandedFolderIds.indexOf(String(id));
        const depth = index !== -1 ? index + 1 : 0;

        const finalDepth = paddingLeft === 0 ? depth - 1 : depth;

        const BASE = 310;
        const STEP = treeConnector ? 32 : 5;

        const width = Math.min(1000, BASE + finalDepth * STEP);

        window.pnpnmAdjustSidebarWidth?.(width);

        scrollToFolder(String(activeFolder?.id));
    }, [expandedFolderIds]);

    const handleChildren = async () => {
        dispatch(setMenu("folder"));

        window.pnpnmMedia?.initFilter([folder]);
        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(String(id))
            ?.trigger("change");

        if (isExpanded) {
            setIsExpanded(false);
            dispatch(setActiveFolder(folder));

            return;
        }

        setIsExpanded(true);
        dispatch(setActiveFolder(folder));

        if (children) return;

        try {
            const response = await getFolder({ id: id ?? "" }).unwrap();

            dispatch(
                setFolders({
                    parentId: id ?? "",
                    children: response?.data?.folders ?? [],
                }),
            );
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to fetch folder children",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const handleAddFolder = (folder: FolderType) => {
        dispatch(
            setFolders({
                parentId: id ?? "",
                children: [folder, ...(children ?? [])],
            }),
        );
    };

    const handleUpdateFolder = (updatedFolder: FolderType) => {
        dispatch(
            updateFolder({
                folderId: id ?? "",
                data: updatedFolder,
            }),
        );
    };

    const handleSelect = () => {
        const alreadySelected = selectedFolders?.find(
            (selected) => selected?.id === id,
        );
        
        if (alreadySelected) {
            dispatch(
                setSelectedFolders(
                    selectedFolders?.filter(
                        (selected) => selected?.id !== id,
                    ) || [],
                ),
            );
        } else {
            dispatch(
                setSelectedFolders([
                    ...(selectedFolders || []),
                    folder,
                ] as FolderType[]),
            );
        }
    };

    const handleSetColor = (c: string) => {
        setColor(c);
        colorRef.current = c;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            colorUpdate(id ?? "", c);
        }, 500);
    };

    const theme =
        data?.display?.theme?.theme ??
        pnpnm?.settings?.display?.theme?.theme ??
        "default";

    const showFolderId = data?.general?.folder?.showFolderId;

    const treeConnector = data?.general?.folder?.treeConnector;

    const selected = selectedFolders?.find((selected) => selected?.id === id);

    const active = activeFolder?.id === id;

    const createActive = createFolder?.create && activeFolder?.id === id;

    const renameActive =
        renameFolder?.rename && renameFolder?.folder?.id === id;

    const isCutFolder =
        cutFolders?.cut &&
        cutFolders?.folders?.some((folder) => folder?.id === id);

    const moveLoading = moveFolder?.move && moveFolder?.folderId === id;

    const isDropTarget =
        (isDragging && hoveredFolderId === String(id)) ||
        (isFolderDragging && folderHoveredId === String(id));

    const isDraggingThis =
        isFolderDragging && String(draggedFolderId) === String(id);

    const loadingLength = Number(childFolders) > 20 ? 20 : Number(childFolders);

    const loading = folderLoading || moveLoading;

    if (isCutFolder || hiddenFolderIds?.includes(id ?? "")) return null;

    return (
        <div
            data-folder-id={id}
            style={{
                marginTop: paddingLeft === 0 ? 0 : treeConnector ? 4 : 5,
                paddingLeft: paddingLeft,
            }}
        >
            {renameActive ? (
                <RenameFolder
                    theme={theme}
                    active={active}
                    open={isExpanded}
                    color={color}
                    setCurrentFolder={handleUpdateFolder}
                    setFolderLoading={setFolderLoading}
                />
            ) : (
                <Folder
                    theme={theme}
                    id={showFolderId ? String(id) : undefined}
                    name={name}
                    color={color}
                    count={attachmentCount}
                    open={isExpanded}
                    active={active}
                    bulkSelect={bulkSelect}
                    selected={!!selected}
                    drop={isDropTarget}
                    onClick={() =>
                        bulkSelect ? handleSelect() : handleChildren()
                    }
                    onDoubleClick={handleChildren}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        show("folder-menu", e as MouseEvent<HTMLElement>, {
                            folder: folder,
                            folders: selectedFolders,
                            colorRef,
                            setColor: handleSetColor,
                        });
                    }}
                    onMouseDown={(e) => {
                        if (e.button !== 0 || bulkSelect) return;
                        startFolderDrag(id ?? "", e.clientX, e.clientY, {
                            folder,
                            active,
                            isExpanded,
                            theme,
                        });
                    }}
                    loading={loading}
                    disabled={isDraggingThis}
                />
            )}

            {createActive && (
                <CreateFolder
                    theme={theme}
                    nested
                    setFolder={handleAddFolder}
                />
            )}

            {isLoading && loadingLength > 0 && (
                <BlockStack
                    gap={treeConnector ? 4 : 5}
                    style={{
                        marginTop: treeConnector ? 0 : 5,
                        paddingTop: treeConnector ? 4 : 0,
                        paddingLeft: treeConnector ? 12 : 10,
                    }}
                    className={clsx(
                        treeConnector && "pnpnm-folder-tree__children",
                        "pnpnm-folder-tree__children-loading",
                    )}
                >
                    {Array?.from({ length: loadingLength })?.map((_, index) => (
                        <div key={index}>
                            <SkeletonLoader.SkeletonFolder
                                theme={theme}
                                className={clsx(
                                    treeConnector &&
                                        "pnpnm-folder-tree__children-loading-item",
                                )}
                            />
                        </div>
                    ))}
                </BlockStack>
            )}

            {isExpanded && children && (
                <BlockStack
                    className={clsx(
                        treeConnector && "pnpnm-folder-tree__children",
                    )}
                >
                    {children?.map((child) => (
                        <FolderTreeNode
                            key={child?.id}
                            folder={child}
                            parentId={id}
                        />
                    ))}
                </BlockStack>
            )}
        </div>
    );
};

export default React.memo(FolderTreeNode);
