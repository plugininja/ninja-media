import { useEffect, useRef, useState } from "@wordpress/element";
import SkeletonLoader from "./SkeletonLoader";
import InlineStack from "../inlineStack";
import Icon from "../icon";
import Card from "../card";

const SkeletonBreadcrumb = ({ folder = false }: { folder?: boolean }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);
    const [widths, setWidths] = useState<number[]>([]);

    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(id);
    }, []);

    useEffect(() => {
        const calculateItems = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;

            if (folder) {
                const gap = 5;
                const minItemWidth = 60;
                const possibleCount = Math.max(
                    4,
                    Math.floor(containerWidth / (minItemWidth + gap)),
                );

                setCount(possibleCount);

                const newWidths = Array.from({ length: possibleCount }).map(
                    () => Math.floor(60 + Math.random() * 120),
                );
                setWidths(newWidths);
            } else {
                const fixedWidth = 245;
                const remainingWidth = Math.max(0, containerWidth - fixedWidth);

                const gap = 5;
                const minItemWidth = 95;
                const dynamicCount = Math.max(
                    1,
                    Math.floor(remainingWidth / (minItemWidth + gap)),
                );

                setCount(dynamicCount);

                const newWidths = Array.from({ length: dynamicCount + 2 }).map(
                    () => Math.floor(60 + Math.random() * 120),
                );
                setWidths(newWidths);
            }
        };

        calculateItems();
        window.addEventListener("resize", calculateItems);

        const interval = setInterval(() => {
            setWidths((prev) =>
                prev.map(() => Math.floor(60 + Math.random() * 120)),
            );
        }, 1400);

        return () => {
            window.removeEventListener("resize", calculateItems);
            clearInterval(interval);
        };
    }, [folder]);

    if (folder) {
        return (
            <InlineStack
                ref={containerRef}
                gap={5}
                wrap={false}
                style={{ width: "100%", overflow: "hidden" }}
            >
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonLoader
                        key={index}
                        width={mounted ? `${widths[index] || 100}px` : "10px"}
                        height="32px"
                        rounded="xs"
                        style={{
                            flexShrink: 0,
                            transition: "width 0.9s ease-in-out",
                            minWidth: "60px",
                        }}
                    />
                ))}
            </InlineStack>
        );
    }

    return (
        <InlineStack
            ref={containerRef}
            gap={5}
            wrap={false}
            style={{ width: "100%", overflow: "hidden" }}
        >
            <Icon name="home" color="primary" fontSize="xl" />

            <InlineStack gap={5} wrap={false}>
                <Icon
                    name="keyboard_arrow_right"
                    color="secondaryblack"
                    fontSize="lg"
                />

                <SkeletonLoader
                    width={mounted ? `${widths[0] || 95}px` : "10px"}
                    height="22px"
                    rounded="sm"
                    style={{
                        transition: "width 0.9s ease-in-out",
                        flexShrink: 0,
                        minWidth: "60px",
                    }}
                />
            </InlineStack>

            <InlineStack gap={5} wrap={false}>
                <Icon
                    name="keyboard_arrow_right"
                    color="secondaryblack"
                    fontSize="lg"
                />

                <Card
                    padding={5}
                    rounded="sm"
                    flex
                    align="center"
                    blockAlign="center"
                    style={{ width: "32px", height: "28px", flexShrink: 0 }}
                >
                    <Icon
                        name="more_horiz"
                        color="secondaryblack"
                        fontSize="lg"
                    />
                </Card>
            </InlineStack>

            {Array.from({ length: count }).map((_, index) => (
                <InlineStack key={index} gap={5} wrap={false}>
                    <Icon
                        name="keyboard_arrow_right"
                        color="secondaryblack"
                        fontSize="lg"
                    />

                    <SkeletonLoader
                        width={
                            mounted ? `${widths[index + 1] || 110}px` : "10px"
                        }
                        height="22px"
                        rounded="sm"
                        style={{
                            transition: "width 0.9s ease-in-out",
                            flexShrink: 0,
                            minWidth: "60px",
                        }}
                    />
                </InlineStack>
            ))}
        </InlineStack>
    );
};

export default SkeletonBreadcrumb;
