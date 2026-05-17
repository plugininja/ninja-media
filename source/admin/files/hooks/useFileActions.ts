import updateFilesCaches from "~/redux/functions/updateFilesCaches";
import { useCustomAlert } from "~/components/alert/Alert";
import { useAppDispatch } from "~/redux/hooks";
import { __, sprintf } from "@wordpress/i18n";
import { useParams } from "react-router-dom";
import { File } from "~/types/file";
import useFile from "./useFile";
import {
    useRestoreFileMutation,
} from "~/redux/api/media";
import {
    deleteFile as deleteFileAction,
} from "~/redux/features/file/file";

const useFileActions = () => {
    const {
        setFile,
        count,
        bulkSelect,
    } = useFile();
    const [restoreFileMutation] = useRestoreFileMutation();

    const { dynamicKey } = useParams();

    const dispatch = useAppDispatch();
    const { showAlert } = useCustomAlert();

    const resetState = () => {
        if (bulkSelect) {
            setFile("selectedFiles", []);
            setFile("bulkSelect", false);
        }
    };

    const getFileLink = (file: File) => {
        const url = file?.url;
        if (!url) return;
        navigator.clipboard.writeText(url);

        showAlert({
            toast: true,
            type: "success",
            text: __("File URL copied to clipboard", "ninja-media"),
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
        });
    };

    const restoreFile = async (ids: (string | number)[]) => {
        showAlert({
            type: "info",
            title: __("Confirm Restore", "ninja-media"),
            text:
                ids.length > 1
                    ? __(
                          "Are you sure you want to restore these files from trash?",
                          "ninja-media",
                      )
                    : __(
                          "Are you sure you want to restore this file from trash?",
                          "ninja-media",
                      ),
            showCancelButton: true,
            confirmButtonText: __("Restore", "ninja-media"),
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

                    setFile("count", {
                        ...count,
                        all: allFiles ?? 0,
                        uncategorized: uncategorized ?? 0,
                        dynamic: dynamicCount,
                        unused: unused ?? 0,
                        trash: trash ?? 0,
                    });

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
                            sprintf(
                                __(
                                    "%d file(s) restored successfully",
                                    "ninja-media",
                                ),
                                ids.length,
                            ),
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                } catch (error: any) {
                    showAlert({
                        toast: true,
                        type: "error",
                        text:
                            error?.data?.message ||
                            __("Failed to restore files", "ninja-media"),
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                    });
                }
            },
        });
    };

    return {
        getFileLink,
        restoreFile,
    };
};

export default useFileActions;
