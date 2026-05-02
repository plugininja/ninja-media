import { useEffect, useRef, useState, useCallback } from "@wordpress/element";
import updateFilesCaches from "~/redux/functions/updateFilesCaches";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { selectSettings } from "~/redux/features/settings";
import { useCustomAlert } from "~/components/alert/Alert";
import { useDeleteFileMutation } from "~/redux/api/media";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import { createRoot } from "@wordpress/element";
import { useParams } from "react-router-dom";
import Button from "~/components/button";
import Card from "~/components/card";
import Text from "~/components/text";
import {
    deleteFile,
    selectFiles,
    setBulkSelect,
    setCount,
    setHiddenFileIds,
    setSelectedFiles,
} from "~/redux/features/files";

const DURATION = 5;

export const DeleteFile = ({
    ids,
    onClose,
}: {
    ids?: (string | number)[];
    onClose: () => void;
}) => {
    const { data } = useAppSelector(selectSettings);
    const [loading, setLoading] = useState(false);

    const { count, selectedFiles, bulkSelect } = useAppSelector(selectFiles);
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

            dispatch(setHiddenFileIds([]));

            if (!enableUndo && bulkSelect) {
                dispatch(setBulkSelect(false));
                dispatch(setSelectedFiles([]));
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
                    `${multiple ? "Files" : "File"} deleted successfully`,
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
                    `Failed to delete ${multiple ? "files" : "file"}`,
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
        progress,
        timeLeft,
        radius,
        circumference,
    }: {
        multiple: boolean;
        onUndo: () => void;
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
                        {multiple ? "Files" : "File"} will be deleted…
                    </Text>
                </InlineStack>

                <Button
                    variant="secondary"
                    size="extrasmall"
                    startIcon="undo"
                    onClick={onUndo}
                >
                    Undo
                </Button>
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
                dispatch(setHiddenFileIds([]));
            }, [stopTimer, dispatch]);

            const cleanup = useCallback(() => {
                stopTimer();
                if (container.parentNode) document.body.removeChild(container);
                if (root) root.unmount();
            }, [stopTimer]);

            useEffect(() => {
                startTimer();
                return cleanup;
            }, [startTimer, cleanup]);

            return (
                <UndoUI
                    multiple={multiple}
                    onUndo={handleUndo}
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

        dispatch(
            setHiddenFileIds(ids ?? selectedFiles?.map((f) => f?.id) ?? []),
        );

        if (bulkSelect) {
            dispatch(setBulkSelect(false));
            dispatch(setSelectedFiles([]));
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
                    Delete
                </Text>

                <Text color="descgray">
                    {multiple
                        ? `Are you sure you want to delete these ${
                              ids?.length ?? 0
                          } files?`
                        : "Are you sure you want to delete this file?"}
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
                    Cancel
                </Button>

                <Button
                    variant="error"
                    size="small"
                    startIcon="delete"
                    onClick={triggerDelete}
                    loading={loading}
                >
                    Delete
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
