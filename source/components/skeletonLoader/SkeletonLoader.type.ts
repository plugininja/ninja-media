import { BorderRadius } from "~/types/styles";

export interface SkeletonLoaderProps {
    id?: string;
    style?: React.CSSProperties;
    className?: string;
    width?: string | number;
    height: string | number;
    animationSpeed?: number;
    rounded?: BorderRadius;
}
