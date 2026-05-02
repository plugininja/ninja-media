import { useEffect, useRef, useState, useCallback } from "@wordpress/element";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useDeleteFolderMutation } from "~/redux/api/media";
import { selectSettings } from "~/redux/features/settings";
import { useCustomAlert } from "~/components/alert/Alert";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import { createRoot } from "@wordpress/element";
import Button from "~/components/button";
import Card from "~/components/card";
import Text from "~/components/text";
import {
    removeFolder,
    selectMedia,
    setBulkSelect,
    setHiddenFolderIds,
    setSelectedFolders,
    setUncategorized,
} from "~/redux/features/media";

const DURATION = 5;

export const DeleteFolder = ({
    id,
    onClose,
}: {
    id?: string;
    onClose: () => void;
}) => {
    const { data } = useAppSelector(selectSettings);
    const [loading, setLoading] = useState(false);

    const { selectedFolders, activeFolder, bulkSelect } =
        useAppSelector(selectMedia);
    const [deleteFolder] = useDeleteFolderMutation();
    const dispatch = useAppDispatch();
    const { showAlert } = useCustomAlert();

    const enableUndo = data?.advanced?.action?.undoActions ?? false;

    const radius = 15;
    const circumference = 2 * Math.PI * radius;

    const multiple = bulkSelect && (selectedFolders?.length ?? 0) > 1;

    const selectedFolderIds = bulkSelect
        ? (selectedFolders?.length ?? 0) > 0
            ? selectedFolders?.map((f) => f?.id)
            : activeFolder
            ? [activeFolder?.id]
            : ([id] as (string | number)[])
        : ([id] as (string | number)[]);

    const performActualDelete = useCallback(async () => {
        setLoading(true);

        try {
            const response = await deleteFolder({
                ids: selectedFolderIds,
            }).unwrap();

            dispatch(removeFolder(selectedFolderIds));
            dispatch(setHiddenFolderIds([]));

            if (!enableUndo && bulkSelect) {
                dispatch(setBulkSelect(false));
                dispatch(setSelectedFolders([]));
            }

            dispatch(setUncategorized(response?.data?.uncategorized ?? 0));

            showAlert({
                toast: true,
                type: "success",
                text:
                    response?.message ||
                    `${multiple ? "Folders" : "Folder"} deleted successfully`,
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
                    `Failed to delete ${multiple ? "folders" : "folder"}`,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
        }
    }, [selectedFolderIds, multiple, deleteFolder, showAlert]);

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
                        {multiple ? "Folders" : "Folder"} will be deleted…
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
                dispatch(setHiddenFolderIds([]));
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

        dispatch(setHiddenFolderIds(selectedFolderIds));

        if (bulkSelect) {
            dispatch(setBulkSelect(false));
            dispatch(setSelectedFolders([]));
        }

        onClose();
        showUndoUI();
    }, [
        enableUndo,
        selectedFolderIds,
        dispatch,
        onClose,
        performActualDelete,
        showUndoUI,
    ]);

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
                        ? `Are you sure you want to delete these ${selectedFolderIds?.length} folders?`
                        : "Are you sure you want to delete this folder?"}
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

export const useDeleteFolder = () => {
    const { showAlert, closeAlert } = useCustomAlert();

    const openDeleteFolder = (id?: string) => {
        showAlert({
            id: "delete-folder-modal",
            type: "info",
            showIcon: false,
            showConfirmButton: false,
            allowEscapeKey: false,
            width: "450px",
            height: "fit-content",
            html: (
                <DeleteFolder
                    id={id}
                    onClose={() => closeAlert("delete-folder-modal")}
                />
            ),
        });
    };

    return { openDeleteFolder };
};
