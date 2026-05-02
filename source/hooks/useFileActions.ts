import updateFilesCaches from "~/redux/functions/updateFilesCaches";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useCustomAlert } from "~/components/alert/Alert";
import { useParams } from "react-router-dom";
import {
    useRestoreFileMutation,
    useTrashFileMutation,
} from "~/redux/api/media";
import {
    selectFiles,
    setBulkSelect,
    setSelectedFiles,
    deleteFile as deleteFileAction,
    setCount,
} from "~/redux/features/files";

const useFileActions = () => {
    const { count, bulkSelect } = useAppSelector(selectFiles);
    const [trashFileMutation] = useTrashFileMutation();
    const [restoreFileMutation] = useRestoreFileMutation();

    const { dynamicKey } = useParams();

    const dispatch = useAppDispatch();
    const { showAlert } = useCustomAlert();

    const resetState = () => {
        if (bulkSelect) {
            dispatch(setSelectedFiles([]));
            dispatch(setBulkSelect(false));
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

                    if (bulkSelect) {
                        resetState();
                    }

                    const {
                        trashed,
                        allFiles,
                        uncategorized,
                        dynamicFolders,
                        unused,
                        trash,
                    } = response?.data || {};

                    dispatch(deleteFileAction(trashed ?? []));

                    const dynamicCount =
                        dynamicKey && dynamicFolders
                            ? dynamicFolders[dynamicKey] ?? 0
                            : Object.keys(dynamicFolders ?? {}).length;

                    dispatch(
                        setCount({
                            ...count,
                            all: allFiles ?? 0,
                            uncategorized: uncategorized ?? 0,
                            dynamic: dynamicCount,
                            unused: unused ?? 0,
                            trash: trash ?? 0,
                        }),
                    );

                    updateFilesCaches(trashed ?? [], {
                        allFiles,
                        uncategorized,
                        unused,
                        trash,
                        dynamicFolders,
                    });

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

                    if (bulkSelect) {
                        resetState();
                    }

                    const {
                        restored,
                        allFiles,
                        uncategorized,
                        dynamicFolders,
                        unused,
                        trash,
                    } = response?.data || {};

                    dispatch(deleteFileAction(restored ?? []));

                    const dynamicCount =
                        dynamicKey && dynamicFolders
                            ? dynamicFolders[dynamicKey] ?? 0
                            : Object.keys(dynamicFolders ?? {}).length;

                    dispatch(
                        setCount({
                            ...count,
                            all: allFiles ?? 0,
                            uncategorized: uncategorized ?? 0,
                            dynamic: dynamicCount,
                            unused: unused ?? 0,
                            trash: trash ?? 0,
                        }),
                    );

                    updateFilesCaches(restored ?? [], {
                        allFiles,
                        uncategorized,
                        unused,
                        trash,
                        dynamicFolders,
                    });

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

    return {
        trashFile,
        restoreFile,
    };
};

export default useFileActions;
