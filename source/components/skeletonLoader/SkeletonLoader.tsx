import { SkeletonLoaderProps } from "./SkeletonLoader.type";
import SkeletonFolder from "./SkeletonFolder";
import type { CSSProperties } from "react";
import SkeletonFile from "./SkeletonFile";
import clsx from "clsx";

const SkeletonLoader = ({
    id,
    style,
    className,
    width,
    height,
    animationSpeed = 1.5,
    rounded = "md",
}: SkeletonLoaderProps) => {
    const combinedStyle: CSSProperties = {
        width,
        height,
        ...style,
        "--pnpnm-skl-animation-speed": `${animationSpeed}s`,
    } as CSSProperties;

    const classes = clsx(
        "pnpnm-skeleton-loader",
        "pnpnm-skeleton-loader--loading",
        `rounded-${rounded}`,
        className,
    );

    return <div id={id} style={combinedStyle} className={classes} />;
};

SkeletonLoader.SkeletonFolder = SkeletonFolder;

SkeletonLoader.SkeletonFile = SkeletonFile;

export default SkeletonLoader;
