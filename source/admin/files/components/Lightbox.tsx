import { createPortal } from "@wordpress/element";
import { useEffect, useCallback, useState } from "@wordpress/element";
import IconButton from "~/components/iconButton";
import { File as FileType } from "~/types/file";
import Text from "~/components/text";
import { __ } from "@wordpress/i18n";

const IMAGE_EXTENSIONS = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "tiff",
    "tif",
    "avif",
    "ico",
]);

export const isImageFile = (file: FileType): boolean =>
    IMAGE_EXTENSIONS.has((file?.extension ?? "").toLowerCase());

interface LightboxProps {
    file: FileType;
    files: FileType[];
    onClose: () => void;
}

const Lightbox = ({ file, files, onClose }: LightboxProps) => {
    const imageFiles = files.filter(isImageFile);
    const [currentIndex, setCurrentIndex] = useState(() =>
        imageFiles.findIndex((f) => f.id === file.id),
    );

    const current = imageFiles[currentIndex] ?? file;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < imageFiles.length - 1;

    const goNext = useCallback(() => {
        if (hasNext) setCurrentIndex((i) => i + 1);
    }, [hasNext]);

    const goPrev = useCallback(() => {
        if (hasPrev) setCurrentIndex((i) => i - 1);
    }, [hasPrev]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
        };

        document.addEventListener("keydown", handleKey);

        return () => {
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose, goNext, goPrev]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose();
        },
        [onClose],
    );

    const portal = (
        <div
            className="pnpnm-lightbox__backdrop"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label={__("Image lightbox", "ninja-media")}
        >
            <div className="pnpnm-lightbox__modal">
                <div className="pnpnm-lightbox__header">
                    <Text
                        size="sm"
                        color="descgray"
                        wrap={false}
                        ellipsis
                        style={{ maxWidth: "70%" }}
                    >
                        {current?.name}
                    </Text>

                    <div className="pnpnm-lightbox__counter">
                        <Text size="xs" color="descgray">
                            {currentIndex + 1} / {imageFiles.length}
                        </Text>
                    </div>

                    <IconButton
                        name="close"
                        variant="primary"
                        size="small"
                        onClick={onClose}
                        aria-label={__("Close lightbox", "ninja-media")}
                    />
                </div>

                <div className="pnpnm-lightbox__stage">
                    {hasPrev && (
                        <button
                            className="pnpnm-lightbox__nav pnpnm-lightbox__nav--prev"
                            onClick={goPrev}
                            aria-label={__("Previous image", "ninja-media")}
                        >
                            <span className="material-symbols-outlined">
                                chevron_left
                            </span>
                        </button>
                    )}

                    <img
                        key={current?.id}
                        src={`${current?.url}?v=${current?.updatedAt}`}
                        alt={current?.name}
                        className="pnpnm-lightbox__image"
                        draggable={false}
                    />

                    {hasNext && (
                        <button
                            className="pnpnm-lightbox__nav pnpnm-lightbox__nav--next"
                            onClick={goNext}
                            aria-label={__("Next image", "ninja-media")}
                        >
                            <span className="material-symbols-outlined">
                                chevron_right
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(portal, document.body);
};

export default Lightbox;
