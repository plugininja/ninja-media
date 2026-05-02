import { useFolderAutoScroll } from "~/hooks/useFolderAutoScroll";
import { useCopyFolderMutation } from "~/redux/api/media";
import { useCustomAlert } from "~/components/alert/Alert";
import { setFolders } from "~/redux/features/media";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import { useAppDispatch } from "~/redux/hooks";
import { useState } from "@wordpress/element";
import Button from "~/components/button";
import { store } from "~/redux/store";
import Card from "~/components/card";
import Text from "~/components/text";

const DuplicateFolder = ({
    parentId,
    id,
    onClose,
}: {
    parentId: string;
    id: string;
    onClose: () => void;
}) => {
    const [copyFolderMutation] = useCopyFolderMutation();
    const [loading, setLoading] = useState(false);
    const { scrollToFolder } = useFolderAutoScroll();

    const dispatch = useAppDispatch();

    const { showAlert } = useCustomAlert();

    const handleDuplicate = async () => {
        setLoading(true);
        try {
            const response = await copyFolderMutation({
                parentId,
                id,
            }).unwrap();

            const folders = response?.data?.folders ?? [];

            const finalId = parentId === "0" ? "root" : parentId;

            const currentChildren =
                store.getState().media.folders[finalId] ?? [];

            dispatch(
                setFolders({
                    parentId: finalId,
                    children: [...currentChildren, ...folders],
                }),
            );

            setTimeout(() => {
                scrollToFolder(String(folders?.[0]?.id));
            }, 500);

            showAlert({
                toast: true,
                type: "success",
                text: response?.message || "Folder duplicated successfully",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to duplicate folder",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <BlockStack gap={20}>
            <Card
                padding={10}
                background="extralight"
                border="light"
                rounded="md"
                style={{ width: "60px", height: "60px" }}
                className="text-primary"
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
                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </Card>

            <BlockStack gap={10}>
                <Text size="xl" weight="semibold">
                    Duplicate
                </Text>

                <Text color="descgray">
                    Are you sure you want to duplicate this folder?
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
                    variant="primary"
                    size="small"
                    startIcon="folder_copy"
                    onClick={handleDuplicate}
                    loading={loading}
                >
                    Duplicate
                </Button>
            </InlineStack>
        </BlockStack>
    );
};

export const useDuplicateFolder = () => {
    const { showAlert, closeAlert } = useCustomAlert();

    const openDuplicateFolder = (parentId: string, id: string) => {
        showAlert({
            id: "duplicate-folder-modal",
            type: "info",
            showIcon: false,
            showConfirmButton: false,
            allowEscapeKey: false,
            width: "410px",
            height: "fit-content",
            html: (
                <DuplicateFolder
                    parentId={parentId}
                    id={id}
                    onClose={() => closeAlert("duplicate-folder-modal")}
                />
            ),
        });
    };

    return { openDuplicateFolder };
};
