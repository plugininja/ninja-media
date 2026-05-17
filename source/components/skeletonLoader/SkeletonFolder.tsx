import InlineStack from "~/components/inlineStack";
import { Theme } from "~/types/settings/settings";
import BlockStack from "~/components/blockStack";
import SkeletonLoader from "./SkeletonLoader";
import { useMemo } from "@wordpress/element";
import Card from "~/components/card";

const SkeletonFolder = ({
    theme = "default",
    style,
    className,
}: {
    theme?: Theme;
    style?: React.CSSProperties;
    className?: string;
}) => {
    const textWidth = useMemo(() => {
        return `${70 + Math.random() * 80}px`;
    }, []);

    return (
        <Card
            padding={3}
            background="white"
            rounded="sm"
            border="transparent"
            flex
            direction="row"
            align="between"
            gap={10}
            wrap={false}
            style={{
                ...style,
                minWidth: 0,
                height: "30px",
                transition: "all 0.2s ease",
            }}
            className={className}
        >
            <InlineStack
                gap={9}
                wrap={false}
                style={{
                    marginLeft: "4px",
                    minWidth: 0,
                }}
            >
                {theme !== "default" && (
                    <Card
                        padding={3}
                        background="white"
                        rounded="xs"
                        border="transparent"
                        flex
                        align="center"
                        blockAlign="center"
                        style={{
                            flexShrink: 0,
                            width: "22px",
                            height: "22px",
                        }}
                    >
                        <SkeletonLoader
                            width={"100%"}
                            height={"100%"}
                            rounded="none"
                        />
                    </Card>
                )}

                <BlockStack
                    style={{
                        flexShrink: 0,
                    }}
                >
                    <SkeletonLoader width={20} height={20} rounded="sm" />
                </BlockStack>

                <SkeletonLoader width={textWidth} height={12} rounded="sm" />
            </InlineStack>

            <Card
                padding={3}
                background="white"
                rounded="xs"
                border="transparent"
                flex
                align="center"
                blockAlign="center"
                style={{
                    flexShrink: 0,
                    width: "22px",
                    height: "22px",
                }}
            >
                <SkeletonLoader width={"100%"} height={"100%"} rounded="none" />
            </Card>
        </Card>
    );
};

export default SkeletonFolder;
