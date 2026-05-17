import { useLocalStorage } from "~/hooks/useLocalStorage";
import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import IconButton from "../iconButton";
import { __ } from "@wordpress/i18n";
import DOCS from "~/constants/docs";
import Tooltip from "../tooltip";
import Status from "../status";
import Card from "../card";
import Text from "../text";
import Icon from "../icon";
import Logo from "../logo";
import clsx from "clsx";
import {
    createContext,
    useCallback,
    useContext,
    useState,
} from "@wordpress/element";
import {
    SidebarBottomProps,
    SidebarContextType,
    SidebarItemProps,
    SidebarMenuProps,
    SidebarProps,
} from "./Sidebar.type";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const useSidebar = () => {
    const context = useContext(SidebarContext);

    if (!context) throw new Error("Sidebar context missing");

    return context;
};

const Sidebar = ({
    id,
    style,
    className,
    defaultCollapsed = false,
    localStorageKey = "pnpnm-sidebar",
    minWidth = 255,
    children,
}: SidebarProps) => {
    const SIDEBAR_MIN_WIDTH = minWidth;

    const SIDEBAR_MAX_WIDTH = 1000;

    const [collapsed, setCollapsed] = useLocalStorage<boolean>(
        localStorageKey,
        defaultCollapsed,
    );
    const [width, setWidth] = useState<number>(SIDEBAR_MIN_WIDTH);
    const [isResizing, setIsResizing] = useState(false);

    const toggle = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const startResize = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsResizing(true);

            const startX = e.clientX;
            const startWidth = width;

            const onMouseMove = (event: MouseEvent) => {
                let newWidth = startWidth + (event.clientX - startX);
                if (newWidth < SIDEBAR_MIN_WIDTH) newWidth = SIDEBAR_MIN_WIDTH;
                if (newWidth > SIDEBAR_MAX_WIDTH) newWidth = SIDEBAR_MAX_WIDTH;
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

    return (
        <SidebarContext.Provider value={{ collapsed }}>
            <BlockStack
                id={id}
                style={{
                    ...style,
                    width: collapsed ? 92 : width,
                    flexShrink: 0,
                    transition:
                        collapsed || !isResizing ? "width 0.25s ease" : "none",
                }}
                className={clsx(
                    "pn-sidebar",
                    collapsed && "pn-sidebar--collapsed",
                    className,
                )}
            >
                <InlineStack
                    align={collapsed ? "center" : "end"}
                    blockAlign="center"
                    gap={5}
                    className="pn-sidebar__header"
                >
                    {!collapsed && (
                        <a
                            href={DOCS.featuresPage}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Logo />
                        </a>
                    )}

                    <Text size="sm" weight="medium">
                        v {pnpnm?.version}
                    </Text>
                </InlineStack>

                <IconButton
                    variant={collapsed ? "primary" : "white"}
                    name="keyboard_tab_rtl"
                    size="small"
                    border
                    borderColor="light"
                    color={collapsed ? "white" : "primary"}
                    fontSize="lg"
                    rounded="md"
                    className="pn-sidebar--toggle"
                    onClick={toggle}
                />

                {children}

                {!collapsed && (
                    <div
                        className="pn-sidebar__resizer"
                        onMouseDown={startResize}
                    />
                )}
            </BlockStack>
        </SidebarContext.Provider>
    );
};

Sidebar.Menu = ({ children }: SidebarMenuProps) => (
    <BlockStack gap={6} className="pn-sidebar__menu">
        {children}
    </BlockStack>
);

Sidebar.Item = ({
    title,
    icon,
    count,
    statusProps,
    active = false,
    onClick,
}: SidebarItemProps) => {
    const { collapsed } = useSidebar();

    return (
        <Tooltip
            title={title as string}
            placement="right"
            wrap="no-wrap"
            arrow
            className="w-full"
            disabled={!collapsed}
        >
            <Card
                padding={6}
                background={active ? "light" : "white"}
                rounded="lg"
                border={active ? "secondary" : "transparent"}
                statusProps={{
                    ...statusProps,
                    top: collapsed ? -5 : 10,
                    right: collapsed ? -5 : 10,
                    tooltipDisabled: collapsed,
                }}
                className="pn-sidebar__menu-item"
                onClick={onClick}
            >
                <InlineStack
                    gap={10}
                    wrap={false}
                    align="between"
                    style={{
                        overflow: collapsed ? "visible" : "hidden",
                    }}
                >
                    <InlineStack gap={10} wrap={false}>
                        {collapsed && typeof count === "number" && count > 0 ? (
                            <BlockStack
                                style={{
                                    position: "relative",
                                    width: "fit-content",
                                    height: "fit-content",
                                }}
                            >
                                <IconButton
                                    variant={active ? "white" : "transparent"}
                                    size="small"
                                    rounded="md"
                                    name={icon}
                                    border={false}
                                    color="primary"
                                    style={{
                                        flexShrink: 0,
                                    }}
                                    className={clsx(
                                        "pn-sidebar__menu-item-button",
                                        active &&
                                            "pn-sidebar__menu-item-button-active",
                                    )}
                                />

                                <Card
                                    padding={3}
                                    background={active ? "white" : "light"}
                                    rounded="sm"
                                    flex
                                    align="center"
                                    blockAlign="center"
                                    style={{
                                        position: "absolute",
                                        top: -15,
                                        left: -15,
                                        minWidth: "25px",
                                        width: "fit-content",
                                        height: "fit-content",
                                    }}
                                    className="pnpnm-fade-in"
                                >
                                    <Text color="black" size="sm">
                                        {count}
                                    </Text>
                                </Card>
                            </BlockStack>
                        ) : (
                            <IconButton
                                variant={active ? "white" : "transparent"}
                                size="small"
                                rounded="md"
                                border={false}
                                name={icon}
                                color="primary"
                                style={{
                                    flexShrink: 0,
                                }}
                                className={clsx(
                                    "pn-sidebar__menu-item-button",
                                    active &&
                                        "pn-sidebar__menu-item-button-active",
                                )}
                            />
                        )}

                        {!collapsed && (
                            <Text
                                color={active ? "black" : "secondaryblack"}
                                weight={active ? "medium" : "normal"}
                                size="md"
                                wrap={false}
                                className="pn-sidebar__menu-item-title"
                            >
                                {title}
                            </Text>
                        )}
                    </InlineStack>

                    {typeof count === "number" && count > 0 && !collapsed && (
                        <Card
                            padding={3}
                            background={active ? "white" : "light"}
                            rounded="sm"
                            flex
                            align="center"
                            blockAlign="center"
                            style={{
                                minWidth: "25px",
                                width: "fit-content",
                                height: "fit-content",
                            }}
                        >
                            <Text color="black" size="sm">
                                {count}
                            </Text>
                        </Card>
                    )}
                </InlineStack>
            </Card>
        </Tooltip>
    );
};

Sidebar.Bottom = ({
    children,
    trash = false,
    trashCount,
    trashActive = false,
    helpCenter = true,
    isPro = false,
    trashClick,
    disabledTrash = false,
}: SidebarBottomProps) => {
    const { collapsed } = useSidebar();

    return (
        <>
            <BlockStack
                align="center"
                inlineAlign="center"
                gap={10}
                className={clsx(
                    "pn-sidebar__bottom-collapsed",
                    collapsed && "pn-sidebar__bottom-collapsed-active",
                )}
            >
                {trash && (
                    <Tooltip
                        title={__("Trash", "ninja-media")}
                        wrap="no-wrap"
                        placement="right"
                    >
                        <BlockStack
                            style={{
                                position: "relative",
                                width: "fit-content",
                                height: "fit-content",
                            }}
                        >
                            <Status
                                isPro={true}
                                size="small"
                                top={-10}
                                right={-10}
                                tooltipDisabled={collapsed}
                            >
                                <IconButton
                                    variant="error"
                                    name="delete"
                                    rounded="md"
                                    iconStyle={{
                                        color: trashActive
                                            ? "var(--pnpnm-white)"
                                            : undefined,
                                    }}
                                    style={{
                                        backgroundColor: trashActive
                                            ? "var(--pnpnm-error)"
                                            : undefined,
                                        opacity: disabledTrash ? 0.5 : 1,
                                        cursor: disabledTrash
                                            ? "not-allowed"
                                            : "pointer",
                                        pointerEvents: disabledTrash
                                            ? "none"
                                            : "auto",
                                    }}
                                    onClick={() =>
                                        !disabledTrash && trashClick?.()
                                    }
                                />
                            </Status>

                            {typeof trashCount === "number" &&
                                trashCount > 0 && (
                                    <Card
                                        padding={3}
                                        background="white"
                                        rounded="sm"
                                        border="errorlight"
                                        flex
                                        align="center"
                                        blockAlign="center"
                                        style={{
                                            position: "absolute",
                                            top: -15,
                                            left: -15,
                                            minWidth: "25px",
                                            width: "fit-content",
                                            height: "fit-content",
                                        }}
                                    >
                                        <Text color="error" size="sm">
                                            {trashCount}
                                        </Text>
                                    </Card>
                                )}
                        </BlockStack>
                    </Tooltip>
                )}

                {helpCenter && (
                    <Tooltip
                        title={__("Help Center", "ninja-media")}
                        wrap="no-wrap"
                        placement="right"
                    >
                        <IconButton
                            variant="secondary"
                            name="contact_support"
                            rounded="md"
                            onClick={() =>
                                window.open(
                                    DOCS?.supportLink,
                                    "_blank",
                                    "noreferrer",
                                )
                            }
                        />
                    </Tooltip>
                )}

                {!pnpnm?.isPro && isPro && (
                    <Tooltip
                        title={__("Upgrade to Pro", "ninja-media")}
                        wrap="no-wrap"
                        placement="right"
                    >
                        <IconButton
                            variant="secondary"
                            name="crown"
                            rounded="md"
                            onClick={() =>
                                window.open(
                                    pnpnm?.upgradeUrl,
                                    "_blank",
                                    "noreferrer",
                                )
                            }
                        />
                    </Tooltip>
                )}
            </BlockStack>

            <BlockStack
                gap={20}
                className="pn-sidebar__bottom pn-sidebar__fade"
            >
                {children}
            </BlockStack>
        </>
    );
};

Sidebar.Trash = ({
    active,
    count,
    onClick,
    disabled = false,
}: {
    active?: boolean;
    count?: number;
    onClick?: () => void;
    disabled?: boolean;
}) => {
    return (
        <Card
            statusProps={{
                isPro: true,
                size: "small",
                placement: "right-center",
                right: 10,
            }}
            padding={10}
            background={active ? "error" : "errorextralight"}
            border={active ? "error" : "errorextralight"}
            flex
            gap={10}
            align="between"
            blockAlign="center"
            style={{
                height: "48px",
                borderRadius: "10px",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                pointerEvents: disabled ? "none" : "auto",
                userSelect: "none",
            }}
            className={clsx(!active && "hover-errorlight")}
            onClick={() => !disabled && onClick?.()}
        >
            <InlineStack gap={8} wrap={false}>
                <Icon
                    name="delete"
                    color={active ? "white" : "error"}
                    fontSize="xl"
                />

                <Text color={active ? "white" : "error"}>
                    {__("Trash", "ninja-media")}
                </Text>
            </InlineStack>

            {typeof count === "number" && count > 0 && (
                <Card
                    padding={3}
                    background={active ? "white" : "errorextralight"}
                    rounded="sm"
                    border="errorlight"
                    flex
                    align="center"
                    blockAlign="center"
                    style={{
                        minWidth: "25px",
                        width: "fit-content",
                        height: "fit-content",
                    }}
                >
                    <Text color="error" size="sm">
                        {count}
                    </Text>
                </Card>
            )}
        </Card>
    );
};

Sidebar.HelpCenter = () => {
    return (
        <InlineStack
            gap={8}
            wrap={false}
            align="between"
            style={{
                cursor: "pointer",
                userSelect: "none",
            }}
            onClick={() =>
                window.open(DOCS.supportLink, "_blank", "noreferrer")
            }
        >
            <InlineStack gap={10} wrap={false}>
                <Icon name="contact_support" color="black" fontSize="xl" />

                <Text color="black">{__("Help Center", "ninja-media")}</Text>
            </InlineStack>

            <Icon name="open_in_new" color="descgray" fontSize="xl" />
        </InlineStack>
    );
};

Sidebar.UpgradePro = () => (
    <InlineStack
        gap={8}
        wrap={false}
        style={{
            cursor: "pointer",
            userSelect: "none",
        }}
        onClick={() => window.open(DOCS.pricingPage, "_blank", "noreferrer")}
    >
        <Icon name="crown" color="primary" fontSize="xl" />

        <Text color="primary">{__("Upgrade to Pro", "ninja-media")}</Text>
    </InlineStack>
);

export default Sidebar;
