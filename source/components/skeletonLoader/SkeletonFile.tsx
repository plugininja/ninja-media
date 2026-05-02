import { useEffect, useState } from "@wordpress/element";
import SkeletonLoader from "./SkeletonLoader";
import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import Card from "../card";

const SkeletonFile = ({
    variant = "grid",
    length = 10,
}: {
    variant?: "grid" | "list";
    length?: number;
}) => {
    const [mounted, setMounted] = useState(false);
    const [randomWidths, setRandomWidths] = useState<
        { name: string; info: string }[]
    >([]);

    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(id);
    }, []);

    useEffect(() => {
        const generateWidths = () => {
            return [...Array(length)].map(() => ({
                name: `${30 + Math.random() * 45}%`,
                info: `${30 + Math.random() * 45}%`,
            }));
        };

        setRandomWidths(generateWidths());

        const interval = setInterval(() => {
            setRandomWidths((prev) =>
                prev.map(() => ({
                    name: `${30 + Math.random() * 45}%`,
                    info: `${30 + Math.random() * 45}%`,
                })),
            );
        }, 1400);

        return () => clearInterval(interval);
    }, [length]);

    const FLEX_VALUES = ["5", "1.3", "1.3", "1.3", "1.5", "1.3"];

    return (
        <>
            {variant === "grid" ? (
                randomWidths?.map(({ name, info }, index) => (
                    <Card
                        key={index}
                        padding={10}
                        background="white"
                        rounded="md"
                        flex
                        direction="col"
                        gap={10}
                    >
                        <SkeletonLoader
                            width="100%"
                            height="150px"
                            rounded="sm"
                        />

                        <BlockStack gap={5}>
                            <SkeletonLoader
                                width={mounted ? name : "10%"}
                                height="18px"
                                rounded="sm"
                                style={{
                                    transition: "width 1s ease-in-out",
                                }}
                            />

                            <InlineStack align="between" gap={5} wrap={false}>
                                <InlineStack
                                    gap={5}
                                    wrap={false}
                                    style={{ width: "100%" }}
                                >
                                    <SkeletonLoader
                                        width="100%"
                                        height="18px"
                                        rounded="sm"
                                    />

                                    <SkeletonLoader
                                        width="100%"
                                        height="18px"
                                        rounded="sm"
                                    />
                                </InlineStack>

                                <SkeletonLoader
                                    width="18px"
                                    height="18px"
                                    rounded="sm"
                                    style={{
                                        flexShrink: 0,
                                    }}
                                />
                            </InlineStack>
                        </BlockStack>
                    </Card>
                ))
            ) : (
                <Card
                    padding={0}
                    background="white"
                    rounded="md"
                    borderStyle="none"
                >
                    {randomWidths?.map(({ name, info }, index) => (
                        <InlineStack
                            key={index}
                            className="pnpnm-file-list-item"
                        >
                            <InlineStack
                                gap={10}
                                wrap={false}
                                style={{ flex: FLEX_VALUES[0] }}
                            >
                                <SkeletonLoader
                                    width="50px"
                                    height="40px"
                                    rounded="sm"
                                    style={{
                                        flexShrink: 0,
                                    }}
                                />

                                <div
                                    style={{
                                        width: "100%",
                                    }}
                                >
                                    <SkeletonLoader
                                        width={mounted ? name : "10%"}
                                        height="18px"
                                        rounded="sm"
                                        style={{
                                            transition: "width 1s ease-in-out",
                                        }}
                                    />
                                </div>
                            </InlineStack>

                            <div
                                style={{
                                    flex: FLEX_VALUES[1],
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <SkeletonLoader
                                    width={mounted ? info : "10%"}
                                    height="18px"
                                    rounded="sm"
                                    style={{
                                        transition: "width 1s ease-in-out",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    flex: FLEX_VALUES[2],
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <SkeletonLoader
                                    width={mounted ? info : "10%"}
                                    height="18px"
                                    rounded="sm"
                                    style={{
                                        transition: "width 1s ease-in-out",
                                    }}
                                />
                            </div>

                            <BlockStack
                                inlineAlign="center"
                                style={{ flex: FLEX_VALUES[3] }}
                            >
                                <SkeletonLoader
                                    width="40px"
                                    height="40px"
                                    rounded="md"
                                />
                            </BlockStack>

                            <div
                                style={{
                                    flex: FLEX_VALUES[4],
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <SkeletonLoader
                                    width={mounted ? info : "10%"}
                                    height="18px"
                                    rounded="sm"
                                    style={{
                                        transition: "width 1s ease-in-out",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    flex: FLEX_VALUES[5],
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <SkeletonLoader
                                    width="70px"
                                    height="28px"
                                    rounded="sm"
                                    style={{
                                        flexShrink: 0,
                                    }}
                                />
                            </div>
                        </InlineStack>
                    ))}
                </Card>
            )}
        </>
    );
};

export default SkeletonFile;
