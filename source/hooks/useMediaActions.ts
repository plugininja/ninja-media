import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useCustomAlert } from "~/components/alert/Alert";
import { store } from "~/redux/store";
import {
    removeFolder,
    selectMedia,
    setAllFiles,
    setCutFolders,
    setFolders,
    setMoveFolder,
    setTrash,
    setUncategorized,
    updateFolder,
} from "~/redux/features/media";
import {
    useAssignFileMutation,
    useDeleteFileMutation,
    useDownloadFolderMutation,
    useMoveFolderMutation,
    useRestoreFileMutation,
    useTrashFileMutation,
    useUpdateFolderMutation,
} from "~/redux/api/media";

const useMediaActions = () => {
    const { menu, folders, cutFolders } = useAppSelector(selectMedia);
    const [updateFolderMutation] = useUpdateFolderMutation();
    const [moveFolderMutation] = useMoveFolderMutation();
    const [downloadFolderMutation] = useDownloadFolderMutation();
    const [assignFileMutation] = useAssignFileMutation();
    const [trashFileMutation] = useTrashFileMutation();
    const [restoreFileMutation] = useRestoreFileMutation();
    const [deleteFileMutation] = useDeleteFileMutation();

    const dispatch = useAppDispatch();

    const { showAlert } = useCustomAlert();

    const forceDisableBulkSelect = () => {
        const $ = (window as any).jQuery as any;

        const button = $(".select-mode-toggle-button");

        if (
            button.length &&
            (button.text().trim() === "Cancel" || button.hasClass("active"))
        ) {
            button[0].click();
        }

        if (window.wp?.media?.frame) {
            const selection = window.wp.media.frame.state().get("selection");
            selection?.reset();
        }
    };

    const colorUpdate = async (id: string | number, color: string | null) => {
        try {
            await updateFolderMutation({ id, color }).unwrap();
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to update folder color",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const moveFolder = async (
        target: string | number,
        drop?: boolean,
        dragged?: string | number,
        folderId?: string | number,
    ) => {
        const ids = drop
            ? [dragged as string | number]
            : cutFolders?.folders?.map((folder) => folder.id) ?? [];

        const foldersToMove = drop
            ? Object.values(folders)
                  .flat()
                  .filter((f) => String(f.id) === String(dragged))
            : cutFolders?.folders ?? [];

        const finalId = target === "root" ? "root" : target;

        try {
            const response = await moveFolderMutation({
                id: finalId,
                ids,
            }).unwrap();

            dispatch(removeFolder(ids));

            const currentChildren =
                store.getState().media.folders[finalId] ?? [];

            let updatedChildren = currentChildren;

            if (drop && folderId && finalId === "root") {
                const targetIndex = currentChildren.findIndex(
                    (f) => String(f.id) === String(folderId),
                );

                if (targetIndex === -1) {
                    updatedChildren = [...currentChildren, ...foldersToMove];
                } else {
                    updatedChildren = [
                        ...currentChildren.slice(0, targetIndex),
                        ...foldersToMove,
                        ...currentChildren.slice(targetIndex),
                    ];
                }
            } else {
                updatedChildren = [...foldersToMove, ...currentChildren];
            }

            dispatch(
                setFolders({
                    parentId: finalId,
                    children: updatedChildren,
                }),
            );

            dispatch(setMoveFolder({ move: false, folderId: null }));
            dispatch(setCutFolders({ cut: false, folders: [] }));

            showAlert({
                toast: true,
                type: "success",
                text:
                    response?.message ||
                    (drop
                        ? "Folder moved successfully"
                        : `${
                              ids.length > 1
                                  ? `${ids.length} folders`
                                  : "1 folder"
                          } cut successfully`),
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            dispatch(setMoveFolder({ move: false, folderId: null }));

            showAlert({
                toast: true,
                type: "error",
                text:
                    error?.data?.message ||
                    (drop ? "Failed to move folder" : "Failed to cut folder"),
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const downloadFolder = async (ids: (string | number)[]) => {
        try {
            const response = await downloadFolderMutation({ ids }).unwrap();

            const downloadUrl = response?.data?.url;
            if (downloadUrl) {
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = "";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to download folder",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const assignFile = async (
        id: string | number,
        attachments: (number | string)[],
    ) => {
        try {
            const response = await assignFileMutation({
                id,
                attachments,
            }).unwrap();

            forceDisableBulkSelect();

            dispatch(
                updateFolder({
                    folderId: id,
                    data: {
                        attachmentCount: Number(response?.data?.total) ?? 0,
                    },
                }),
            );

            dispatch(
                updateFolder({
                    folderId: response?.data?.previousFolder?.id!,
                    data: {
                        attachmentCount:
                            Number(response?.data?.previousFolder?.remaining) ??
                            0,
                    },
                }),
            );

            dispatch(setUncategorized(response?.data?.uncategorizedCount ?? 0));

            if (
                response?.data?.previousFolder?.id ||
                menu === "uncategorized"
            ) {
                response?.data?.assigned?.forEach(
                    (attachmentId: number | string) => {
                        const el = document.querySelector(
                            `.attachments-wrapper .attachment[data-id="${attachmentId}"]`,
                        ) as HTMLElement | null;

                        if (el) el.remove();
                    },
                );
            }

            showAlert({
                toast: true,
                type: "success",
                text:
                    response?.message ||
                    `${
                        attachments.length > 1
                            ? `${attachments.length} files`
                            : "1 file"
                    } assigned successfully`,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to assign files",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const trashFile = async (ids: (string | number)[]) => {
        showAlert({
            type: "error",
            title: "Confirm Trash",
            text: `Are you sure you want to move ${
                ids.length > 1 ? "these files" : "this file"
            } to trash?`,
            showCancelButton: true,
            confirmButtonText: "Trash",
            onConfirm: async () => {
                try {
                    const response = await trashFileMutation({ ids }).unwrap();

                    if (response?.data?.trashed?.length) {
                        response.data.trashed.forEach((attachmentId) => {
                            const el = document.querySelector(
                                `.attachments-wrapper .attachment[data-id="${attachmentId}"]`,
                            ) as HTMLElement | null;

                            if (el) el.remove();
                        });
                    }

                    forceDisableBulkSelect();

                    response?.data?.folders?.forEach((folder) => {
                        dispatch(
                            updateFolder({
                                folderId: folder?.id,
                                data: {
                                    attachmentCount:
                                        Number(folder?.remaining) ?? 0,
                                },
                            }),
                        );
                    });

                    dispatch(setAllFiles(response?.data?.allFiles ?? 0));

                    dispatch(
                        setUncategorized(response?.data?.uncategorized ?? 0),
                    );

                    dispatch(setTrash(response?.data?.trash ?? 0));

                    showAlert({
                        toast: true,
                        type: "success",
                        text:
                            response?.message ||
                            `${ids.length} file(s) moved to trash successfully`,
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                } catch (error: any) {
                    showAlert({
                        toast: true,
                        type: "error",
                        text: error?.data?.message || "Failed to trash files",
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                }
            },
        });
    };

    const restoreFile = async (ids: (string | number)[]) => {
        showAlert({
            type: "info",
            title: "Confirm Restore",
            text: `Are you sure you want to restore ${
                ids.length > 1 ? "these files" : "this file"
            } from trash?`,
            showCancelButton: true,
            confirmButtonText: "Restore",
            onConfirm: async () => {
                try {
                    const response = await restoreFileMutation({
                        ids,
                    }).unwrap();

                    forceDisableBulkSelect();

                    if (response?.data?.restored?.length) {
                        response.data.restored.forEach((attachmentId) => {
                            const el = document.querySelector(
                                `.attachments-wrapper .attachment[data-id="${attachmentId}"]`,
                            ) as HTMLElement | null;

                            if (el) el.remove();
                        });
                    }

                    response?.data?.folders?.forEach((folder) => {
                        dispatch(
                            updateFolder({
                                folderId: folder?.id,
                                data: {
                                    attachmentCount:
                                        Number(folder?.remaining) ?? 0,
                                },
                            }),
                        );
                    });

                    dispatch(setAllFiles(response?.data?.allFiles ?? 0));

                    dispatch(
                        setUncategorized(response?.data?.uncategorized ?? 0),
                    );

                    dispatch(setTrash(response?.data?.trash ?? 0));

                    showAlert({
                        toast: true,
                        type: "success",
                        text:
                            response?.message ||
                            `${ids.length} file(s) restored successfully`,
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                } catch (error: any) {
                    showAlert({
                        toast: true,
                        type: "error",
                        text: error?.data?.message || "Failed to restore files",
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                }
            },
        });
    };

    const deleteFile = async (ids: (string | number)[]) => {
        showAlert({
            type: "error",
            title: "Confirm Delete",
            text: `Are you sure you want to delete ${
                ids.length > 1 ? "these files" : "this file"
            } permanently?`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            onConfirm: async () => {
                try {
                    const response = await deleteFileMutation({ ids }).unwrap();

                    forceDisableBulkSelect();

                    if (response?.data?.deleted?.length) {
                        response.data.deleted.forEach((attachmentId) => {
                            const el = document.querySelector(
                                `.attachments-wrapper .attachment[data-id="${attachmentId}"]`,
                            ) as HTMLElement | null;

                            if (el) el.remove();
                        });
                    }

                    response?.data?.folders?.forEach((folder) => {
                        dispatch(
                            updateFolder({
                                folderId: folder?.id,
                                data: {
                                    attachmentCount:
                                        Number(folder?.remaining) ?? 0,
                                },
                            }),
                        );
                    });

                    dispatch(setAllFiles(response?.data?.allFiles ?? 0));

                    dispatch(
                        setUncategorized(response?.data?.uncategorized ?? 0),
                    );

                    dispatch(setTrash(response?.data?.trash ?? 0));

                    showAlert({
                        toast: true,
                        type: "success",
                        text:
                            response?.message ||
                            `${ids.length} file(s) deleted successfully`,
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                } catch (error: any) {
                    showAlert({
                        toast: true,
                        type: "error",
                        text: error?.data?.message || "Failed to delete files",
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                }
            },
        });
    };

    return {
        colorUpdate,
        moveFolder,
        downloadFolder,
        assignFile,
        trashFile,
        restoreFile,
        deleteFile,
    };
};

export default useMediaActions;
