import type { AvatarProps } from "./Avatar.type";
import SkeletonLoader from "../skeletonLoader";
import { useState } from "@wordpress/element";
import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import Card from "../card";
import clsx from "clsx";

const Avatar = ({
    id,
    style,
    className,
    src,
    alt,
    width,
    height,
    rounded = "none",
    objectFit = "cover",
    referrerPolicy = "no-referrer",
    fallback,
    fallBackLimit,
    showSpinner = false,
}: AvatarProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getFallbackContent = () => {
        if (typeof fallback === "string") {
            return fallback
                .split(/\s+/)
                .filter((word) => word.length > 0)
                .slice(0, fallBackLimit || Infinity)
                .map((word) => word[0].toUpperCase())
                .join("");
        }
        return fallback;
    };

    const styles = {
        width: width || "auto",
        height: height || "auto",
        ...style,
    };

    const imageStyle = {
        display: imageLoaded ? "block" : "none",
        width: "100%",
        height: "100%",
        objectFit: objectFit,
    };

    const shouldShowSpinner =
        showSpinner && !!src && !imageLoaded && !imageError;

    return (
        <BlockStack
            id={id}
            style={styles}
            align="center"
            inlineAlign="center"
            className={className}
        >
            {shouldShowSpinner && (
                <BlockStack
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    align="center"
                    inlineAlign="center"
                >
                    <SkeletonLoader width="100%" height="100%" />
                </BlockStack>
            )}

            {src && !imageError && (
                <img
                    src={src}
                    alt={alt}
                    style={{
                        ...imageStyle,
                        userSelect: "none",
                    }}
                    className={clsx(`rounded-${rounded}`)}
                    referrerPolicy={referrerPolicy}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                />
            )}

            {(!src || imageError) && (
                <InlineStack align="center">
                    <Card
                        padding={0}
                        style={styles}
                        background="white"
                        rounded={rounded}
                        flex
                        align="center"
                        blockAlign="center"
                        className="text-black font-semibold"
                    >
                        {getFallbackContent()}
                    </Card>
                </InlineStack>
            )}
        </BlockStack>
    );
};

export default Avatar;
