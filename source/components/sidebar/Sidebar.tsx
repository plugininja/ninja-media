import { useLocalStorage } from "~/hooks/useLocalStorage";
import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import IconButton from "../iconButton";
import { __ } from "@wordpress/i18n";
import DOCS from "~/constants/docs";
import Tooltip from "../tooltip";
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
                    width: collapsed ? 98 : width,
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
                    gap={5}
                    className="pn-sidebar__header"
                >
                    {!collapsed && (
                        <a
                            href={pnpnm?.siteUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Logo />
                        </a>
                    )}

                    <IconButton
                        variant={collapsed ? "primary" : "secondary"}
                        name="keyboard_tab_rtl"
                        size="small"
                        color={collapsed ? "white" : "primary"}
                        fontSize="lg"
                        rounded="md"
                        className="pn-sidebar__header--toggle"
                        onClick={toggle}
                    />
                </InlineStack>

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
    <BlockStack gap={10} className="pn-sidebar__menu">
        {children}
    </BlockStack>
);

Sidebar.Item = ({
    title,
    icon,
    count,
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
                padding={10}
                background={active ? "primary" : "white"}
                rounded="lg"
                borderStyle="none"
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
                                    variant={active ? "white" : "secondary"}
                                    size="small"
                                    rounded="md"
                                    name={icon}
                                    color="primary"
                                    borderStyle={active ? "none" : "solid"}
                                    style={{
                                        flexShrink: 0,
                                    }}
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
                                variant={active ? "white" : "secondary"}
                                size="small"
                                rounded="md"
                                name={icon}
                                color="primary"
                                borderStyle={active ? "none" : "solid"}
                                style={{
                                    flexShrink: 0,
                                }}
                            />
                        )}

                        {!collapsed && (
                            <Text
                                color={active ? "pure" : "black"}
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
                                onClick={() => !disabledTrash && trashClick?.()}
                            />

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

                <Text size="sm" weight="medium">
                    v {pnpnm?.version}
                </Text>
            </BlockStack>

            <BlockStack
                gap={10}
                className="pn-sidebar__bottom pn-sidebar__fade"
            >
                {children}

                <InlineStack
                    gap={5}
                    align="between"
                    wrap={false}
                    style={{ paddingLeft: "5px", paddingRight: "5px" }}
                >
                    <Text size="sm" weight="medium">
                        {__("Version", "ninja-media")}
                    </Text>

                    <Text size="sm" weight="medium">
                        {pnpnm?.version}
                    </Text>
                </InlineStack>
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

                <Text color={active ? "white" : "error"}>Trash</Text>
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
            className="pn-sidebar__bottom-help-center"
            onClick={() =>
                window.open(DOCS.supportLink, "_blank", "noreferrer")
            }
        >
            <Icon name="contact_support" fontSize="xl" />

            <Text className="pn-sidebar__bottom-help-center-title">
                {__("Help Center", "ninja-media")}
            </Text>

            {/* <Icon name="open_in_new" fontSize="lg" /> */}
        </InlineStack>
    );
};

export default Sidebar;
