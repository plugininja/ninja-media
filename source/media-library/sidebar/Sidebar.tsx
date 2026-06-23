import { useCallback, useEffect, useRef, useState } from "@wordpress/element";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import useMedia from "~/media-library/hooks/useMedia";
import InlineStack from "~/components/inlineStack";
import IconButton from "~/components/iconButton";
import DOCS from "~/constants/docs";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";
import { __ } from "@wordpress/i18n";
import clsx from "clsx";

const COLLAPSED_WIDTH = 25;
const DEFAULT_WIDTH = 310;
const MAX_WIDTH = 1000;

const Sidebar = ({ children }: { children: React.ReactNode }) => {
    const [collapsed, setCollapsed] = useLocalStorage<boolean>(
        "nm-sidebar-collapsed",
        false,
    );
    const [width, setWidth] = useLocalStorage<number>(
        "nm-sidebar-width",
        Number(DEFAULT_WIDTH),
    );

    const [isResizing, setIsResizing] = useState(false);
    const [initialDone, setInitialDone] = useState(false);
    const isFirstRender = useRef(true);

    const { setMedia, menu, trash: trashed } = useMedia();

    const trash = menu === "trash";

    const targetWidth = collapsed ? COLLAPSED_WIDTH : width;

    const applyLayout = (w: number, withTransition: boolean) => {
        const content = document.getElementById("wpbody-content");
        const wrapper = document.getElementById(
            "pnpnm-media-library-sidebar-wrapper",
        );

        if (!wrapper) return;

        wrapper.style.borderRight = "1px solid #ddd";

        if (pnpnm.pagenow !== "upload.php") {
            wrapper.style.transition = withTransition
                ? "width 0.3s ease"
                : "none";
            wrapper.style.width = `${w}px`;

            const classes = [
                "media-frame-title",
                "media-frame-content",
                "media-frame-router",
                "media-frame-toolbar",
            ];

            classes.forEach((className) => {
                const elements = document.getElementsByClassName(className);

                Array.from(elements).forEach((element) => {
                    (element as HTMLElement).style.left = `${w}px`;
                    (
                        element as HTMLElement
                    ).style.width = `calc(100% - ${w}px)`;
                    (element as HTMLElement).style.transition = withTransition
                        ? "left 0.3s ease, width 0.3s ease"
                        : "none";
                });
            });

            return;
        }

        if (!content) return;

        content.style.transition = withTransition
            ? "width 0.3s ease, margin-left 0.3s ease"
            : "none";
        wrapper.style.transition = withTransition ? "width 0.3s ease" : "none";
        content.style.width = `calc(100% - ${w}px)`;
        content.style.marginLeft = `${w}px`;
        wrapper.style.width = `${w}px`;
    };

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            applyLayout(targetWidth, true);
            isFirstRender.current = false;

            const timer = setTimeout(() => {
                setInitialDone(true);
            }, 320);

            return () => clearTimeout(timer);
        });

        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        window.pnpnmAdjustSidebarWidth = (newWidth: number) => {
            if (newWidth > width) {
                setWidth(newWidth);
            }
        };

        return () => {
            delete window.pnpnmAdjustSidebarWidth;
        };
    }, [width]);

    useEffect(() => {
        if (isFirstRender.current) return;
        applyLayout(targetWidth, !isResizing);
    }, [collapsed, width, isResizing]);

    const toggle = () => {
        const newCollapsed = !collapsed;
        setCollapsed(newCollapsed);

        if (!newCollapsed) {
            setInitialDone(false);
            const timer = setTimeout(() => {
                setInitialDone(true);
            }, 320);
            return () => clearTimeout(timer);
        }
    };

    const startResize = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsResizing(true);

            const startX = e.clientX;
            const startWidth = width;

            const onMouseMove = (event: MouseEvent) => {
                let newWidth = startWidth + (event.clientX - startX);
                if (newWidth < DEFAULT_WIDTH) newWidth = DEFAULT_WIDTH;
                if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
                setWidth(newWidth);
            };

            const onMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },
        [width],
    );

    const isContentVisible = initialDone && !collapsed;

    return (
        <div
            className={clsx(
                "pnpnm-sidebar",
                pnpnm.pagenow !== "upload.php" && "pnpnm-sidebar--others",
            )}
        >
            <div
                style={{
                    visibility: isContentVisible ? "visible" : "hidden",
                    opacity: isContentVisible ? 1 : 0,
                    transition: initialDone
                        ? "opacity 0.2s ease, visibility 0s linear 0s"
                        : "none",
                    ...(isContentVisible === false &&
                        initialDone && {
                            transition:
                                "opacity 0.2s ease, visibility 0s linear 0.2s",
                        }),
                }}
                className={clsx("pnpnm-sidebar__content")}
            >
                <div className="pnpnm-sidebar__inner">{children}</div>

                {!pnpnm?.isPro && (
                    <div style={{ padding: "10px 20px 20px" }}>
                        <Card
                            padding={10}
                            background="pro"
                            rounded="md"
                            flex
                            align="center"
                            blockAlign="center"
                            gap={10}
                            style={{
                                cursor: "pointer",
                                userSelect: "none",
                                justifyContent: "center",
                                width: "100%",
                            }}
                            onClick={() =>
                                window.open(
                                    DOCS?.pricingPage,
                                    "_blank",
                                    "noopener noreferrer",
                                )
                            }
                        >
                            <Icon name="upgrade" color="dark" fontSize="xl" />

                            <Text color="dark" size="sm">
                                {__("Upgrade to Pro", "ninja-media")}
                            </Text>
                        </Card>
                    </div>
                )}

                <div className="pnpnm-sidebar__trash-wrapper">
                    <Card
                        statusProps={{
                            isPro: true,
                            size: "small",
                            placement: "right-center",
                            right: 30,
                        }}
                        padding={10}
                        background={trash ? "error" : "errorextralight"}
                        border={trash ? "error" : "errorlight"}
                        rounded="md"
                        flex
                        direction="row"
                        align="between"
                        blockAlign="center"
                        gap={10}
                        style={{
                            height: "45px",
                            userSelect: "none",
                        }}
                        className={clsx(
                            "pnpnm-sidebar__trash",
                            !trash && "hover-errorlight",
                        )}
                        onClick={() => {
                        }}
                    >
                        <InlineStack gap={7} wrap={false}>
                            <Icon
                                name="delete"
                                color={trash ? "white" : "error"}
                                fontSize="lg"
                                style={{
                                    marginBottom: "3px",
                                }}
                            />

                            <Text color={trash ? "white" : "error"}>
                                Trash Bin
                            </Text>
                        </InlineStack>

                        {trashed > 0 && (
                            <Card
                                padding={3}
                                background={trash ? "white" : "errorextralight"}
                                border="errorlight"
                                rounded="sm"
                                flex
                                align="center"
                                blockAlign="center"
                                style={{
                                    minWidth: "24px",
                                    width: "fit-content",
                                    height: "25px",
                                }}
                            >
                                <Text color="error" size="sm">
                                    {trashed}
                                </Text>
                            </Card>
                        )}
                    </Card>
                </div>

                <div
                    className="pnpnm-sidebar__resizer"
                    onMouseDown={startResize}
                />
            </div>

            <IconButton
                variant="primary"
                size="supersmall"
                rounded="full"
                name="keyboard_tab_rtl"
                fontSize="sm"
                style={{
                    transition:
                        "background-color 0.3s ease, transform 0.3s ease",
                    transform: collapsed ? "scaleX(-1)" : "scaleX(1)",
                }}
                className="pnpnm-sidebar__toggle"
                onClick={toggle}
            />
        </div>
    );
};

export default Sidebar;
