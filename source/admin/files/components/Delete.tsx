import { useEffect, useRef, useState, useCallback } from "@wordpress/element";
import updateFilesCaches from "~/redux/functions/updateFilesCaches";
import { useCustomAlert } from "~/components/alert/Alert";
import { useDeleteFileMutation } from "~/redux/api/media";
import { deleteFile } from "~/redux/features/file/file";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import { createRoot } from "@wordpress/element";
import { useAppDispatch } from "~/redux/hooks";
import { __, sprintf } from "@wordpress/i18n";
import useSettings from "~/hooks/useSettings";
import { useParams } from "react-router-dom";
import Button from "~/components/button";
import useFile from "../hooks/useFile";
import Card from "~/components/card";
import Text from "~/components/text";

const DURATION = 5;

export const DeleteFile = ({
    ids,
    onClose,
}: {
    ids?: (string | number)[];
    onClose: () => void;
}) => {
    const { data } = useSettings();
    const [loading, setLoading] = useState(false);

    const { setFile, count, selectedFiles, bulkSelect } = useFile();
    const [deleteFileMutation] = useDeleteFileMutation();
    const dispatch = useAppDispatch();
    const { showAlert } = useCustomAlert();

    const { dynamicKey } = useParams();

    const enableUndo = data?.advanced?.action?.undoActions ?? false;

    const radius = 15;
    const circumference = 2 * Math.PI * radius;

    const multiple = bulkSelect && (ids?.length ?? 0) > 1;

    const performActualDelete = useCallback(async () => {
        setLoading(true);

        try {
            const response = await deleteFileMutation({
                ids: ids ?? selectedFiles?.map((f) => f?.id) ?? [],
            }).unwrap();

            setFile("hiddenFileIds", []);

            if (!enableUndo && bulkSelect) {
                setFile("bulkSelect", false);
                setFile("selectedFiles", []);
            }

            const {
                deleted,
                allFiles,
                uncategorized,
                dynamicFolders,
                unused,
                trash,
            } = response?.data || {};

            dispatch(deleteFile(deleted ?? []));

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

            updateFilesCaches(deleted ?? [], {
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
                    (multiple
                        ? __("Files deleted successfully", "ninja-media")
                        : __("File deleted successfully", "ninja-media")),
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
                    (multiple
                        ? __("Failed to delete files", "ninja-media")
                        : __("Failed to delete file", "ninja-media")),
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
        }
    }, [ids, multiple, deleteFileMutation, showAlert]);

    const UndoUI = ({
        multiple,
        onUndo,
        onDeleteNow,
        progress,
        timeLeft,
        radius,
        circumference,
    }: {
        multiple: boolean;
        onUndo: () => void;
        onDeleteNow: () => void;
        progress: number;
        timeLeft: number;
        radius: number;
        circumference: number;
    }) => (
        <div className="pnpnm-undo-popup">
            <InlineStack align="between" gap={10}>
                <InlineStack gap={10}>
                    <div className="pnpnm-undo-popup__circle">
                        <svg viewBox="0 0 36 36">
                            <circle
                                className="pnpnm-undo-popup__circle-bg"
                                cx="18"
                                cy="18"
                                r={radius}
                            />

                            <circle
                                className="pnpnm-undo-popup__circle-progress"
                                cx="18"
                                cy="18"
                                r={radius}
                                strokeDasharray={circumference}
                                strokeDashoffset={
                                    circumference -
                                    (circumference * progress) / 100
                                }
                            />
                        </svg>

                        <span>{timeLeft}</span>
                    </div>

                    <Text size="sm">
                        {multiple
                            ? __("Files will be deleted…", "ninja-media")
                            : __("File will be deleted…", "ninja-media")}
                    </Text>
                </InlineStack>

                <InlineStack gap={10} wrap={false} align="end">
                    <Button
                        variant="secondary"
                        size="extrasmall"
                        startIcon="undo"
                        onClick={onUndo}
                    >
                        {__("Undo", "ninja-media")}
                    </Button>

                    <Button
                        variant="secondary"
                        size="extrasmall"
                        startIcon="delete_history"
                        onClick={onDeleteNow}
                    >
                        {__("Delete", "ninja-media")}
                    </Button>
                </InlineStack>
            </InlineStack>

            <div
                className="pnpnm-undo-popup__bottom-bar"
                style={{ width: `${progress}%` }}
            />
        </div>
    );

    const showUndoUI = useCallback(() => {
        const container = document.createElement("div");
        container.id = "pnpnm-undo-fixed";
        container.className = "pnpnm-top-level-wrapper";
        document.body.appendChild(container);

        let root: any = null;

        const UndoWrapper = () => {
            const [progress, setProgress] = useState(100);
            const rafRef = useRef<number | null>(null);
            const startTimeRef = useRef<number | null>(null);
            const didUndoRef = useRef(false);

            const stopTimer = useCallback(() => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            }, []);

            const startTimer = useCallback(() => {
                stopTimer();
                didUndoRef.current = false;
                startTimeRef.current = performance.now();

                const tick = (now: number) => {
                    const elapsed = (now - startTimeRef.current!) / 1000;
                    const remaining = Math.max(0, 1 - elapsed / DURATION);
                    setProgress(remaining * 100);

                    if (remaining > 0) {
                        rafRef.current = requestAnimationFrame(tick);
                    } else if (!didUndoRef.current) {
                        cleanup();
                        performActualDelete();
                    }
                };

                rafRef.current = requestAnimationFrame(tick);
            }, [stopTimer, performActualDelete]);

            const handleUndo = useCallback(() => {
                didUndoRef.current = true;
                stopTimer();
                cleanup();
                setFile("hiddenFileIds", []);
            }, [stopTimer, setFile]);

            const cleanup = useCallback(() => {
                stopTimer();
                if (container.parentNode) document.body.removeChild(container);
                if (root) root.unmount();
            }, [stopTimer]);

            const handleDeleteNow = useCallback(() => {
                didUndoRef.current = true;
                stopTimer();
                cleanup();
                performActualDelete();
            }, [stopTimer, cleanup, performActualDelete]);

            useEffect(() => {
                startTimer();
                return cleanup;
            }, [startTimer, cleanup]);

            return (
                <UndoUI
                    multiple={multiple}
                    onUndo={handleUndo}
                    onDeleteNow={handleDeleteNow}
                    progress={progress}
                    timeLeft={Math.ceil((progress / 100) * DURATION)}
                    radius={radius}
                    circumference={circumference}
                />
            );
        };

        root = createRoot(container);
        root.render(<UndoWrapper />);
    }, [performActualDelete, multiple, radius, circumference]);

    const triggerDelete = useCallback(() => {
        if (!enableUndo) {
            performActualDelete();
            onClose();
            return;
        }

        setFile("hiddenFileIds", ids ?? selectedFiles?.map((f) => f?.id) ?? []);

        if (bulkSelect) {
            setFile("bulkSelect", false);
            setFile("selectedFiles", []);
        }

        onClose();
        showUndoUI();
    }, [enableUndo, ids, dispatch, onClose, performActualDelete, showUndoUI]);

    return (
        <BlockStack gap={20}>
            <Card
                padding={10}
                background="errorextralight"
                border="errorlight"
                rounded="md"
                style={{ width: "60px", height: "60px" }}
                className="text-error"
            >
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M15 9l-6 6M9 9l6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </Card>

            <BlockStack gap={10}>
                <Text size="xl" weight="semibold">
                    {__("Delete", "ninja-media")}
                </Text>

                <Text color="descgray">
                    {multiple
                        ? sprintf(
                              __(
                                  "Are you sure you want to delete these %d files?",
                                  "ninja-media",
                              ),
                              ids?.length ?? 0,
                          )
                        : __(
                              "Are you sure you want to delete this file?",
                              "ninja-media",
                          )}
                </Text>
            </BlockStack>

            <InlineStack align="end" gap={10}>
                <Button
                    variant="secondary"
                    size="small"
                    startIcon="cancel"
                    onClick={onClose}
                    disabled={loading}
                >
                    {__("Cancel", "ninja-media")}
                </Button>

                <Button
                    variant="error"
                    size="small"
                    startIcon="delete"
                    onClick={triggerDelete}
                    loading={loading}
                >
                    {__("Delete", "ninja-media")}
                </Button>
            </InlineStack>
        </BlockStack>
    );
};

export const useDeleteFile = () => {
    const { showAlert, closeAlert } = useCustomAlert();

    const openDeleteFile = (ids?: (string | number)[]) => {
        showAlert({
            id: "delete-file-modal",
            type: "info",
            showIcon: false,
            showConfirmButton: false,
            allowEscapeKey: false,
            width: "450px",
            height: "fit-content",
            html: (
                <DeleteFile
                    ids={ids}
                    onClose={() => closeAlert("delete-file-modal")}
                />
            ),
        });
    };

    return { openDeleteFile };
};
