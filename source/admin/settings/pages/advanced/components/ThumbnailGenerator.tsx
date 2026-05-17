import { useCallback, useState } from "@wordpress/element";
import InlineStack from "~/components/inlineStack";
import { __, sprintf } from "@wordpress/i18n";
import Button from "~/components/button";
import Icon from "~/components/icon";
import Text from "~/components/text";
import {
    useGenerateThumbnailsMutation,
    useGetThumbnailCountQuery,
} from "~/redux/api/settings";

const BATCH_SIZE = 5;

const ThumbnailGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [processed, setProcessed] = useState(0);
    const [total, setTotal] = useState<number | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { data: countData, refetch: refetchCount } =
        useGetThumbnailCountQuery();
    const [generateThumbnails] = useGenerateThumbnailsMutation();

    const runBatch = useCallback(
        async (offset: number, grandTotal: number) => {
            try {
                const result = await generateThumbnails({
                    offset,
                    batch_size: BATCH_SIZE,
                }).unwrap();

                const newOffset = result?.data?.offset ?? 0;

                setProcessed(newOffset);

                if (result?.data?.is_complete) {
                    setIsGenerating(false);
                    setIsComplete(true);
                    return;
                }

                await runBatch(newOffset, grandTotal);
            } catch {
                setIsGenerating(false);
                setHasError(true);
            }
        },
        [generateThumbnails],
    );

    const handleGenerate = async () => {
        setIsGenerating(true);
        setIsComplete(false);
        setHasError(false);
        setProcessed(0);

        try {
            const countResult = await refetchCount();
            const imageTotal = countResult.data?.data?.total ?? 0;

            setTotal(imageTotal);

            if (imageTotal === 0) {
                setIsGenerating(false);
                setIsComplete(true);
                return;
            }

            await runBatch(0, imageTotal);
        } catch {
            setIsGenerating(false);
            setHasError(true);
        }
    };

    const handleReset = () => {
        setIsComplete(false);
        setHasError(false);
        setProcessed(0);
        setTotal(null);
    };

    const imageTotal = total ?? countData?.data?.total ?? 0;

    const renderStatus = () => {
        if (hasError) {
            return (
                <InlineStack gap={6} align="center">
                    <Icon name="error" color="error" fontSize="lg" />

                    <Text size="sm" color="error">
                        {__(
                            "Generation failed. Please try again.",
                            "ninja-media",
                        )}
                    </Text>
                </InlineStack>
            );
        }

        if (isComplete) {
            return (
                <InlineStack gap={6} align="center">
                    <Icon name="check_circle" color="primary" fontSize="lg" />

                    <Text size="sm" color="primary">
                        {imageTotal === 0
                            ? __("No images found.", "ninja-media")
                            : sprintf(
                                  __(
                                      "Done! %d image(s) processed.",
                                      "ninja-media",
                                  ),
                                  imageTotal,
                              )}
                    </Text>
                </InlineStack>
            );
        }

        if (isGenerating) {
            return (
                <InlineStack gap={6} align="center">
                    <Icon
                        name="progress_activity"
                        className="loading"
                        fontSize="lg"
                    />

                    <Text size="sm">
                        {imageTotal > 0
                            ? sprintf(
                                  __("Generating… %1$d / %2$d", "ninja-media"),
                                  processed,
                                  imageTotal,
                              )
                            : __("Preparing…", "ninja-media")}
                    </Text>
                </InlineStack>
            );
        }

        return null;
    };

    return (
        <InlineStack gap={12} align="center">
            {isComplete || hasError ? (
                <Button
                    variant="secondary"
                    size="small"
                    startIcon="autorenew"
                    onClick={handleReset}
                >
                    {__("Reset", "ninja-media")}
                </Button>
            ) : (
                <Button
                    variant="primary"
                    size="small"
                    startIcon="auto_fix_high"
                    loading={isGenerating}
                    disabled={isGenerating}
                    onClick={handleGenerate}
                >
                    {isGenerating
                        ? __("Generating…", "ninja-media")
                        : __("Generate Thumbnails", "ninja-media")}
                </Button>
            )}

            {renderStatus()}
        </InlineStack>
    );
};

export default ThumbnailGenerator;
