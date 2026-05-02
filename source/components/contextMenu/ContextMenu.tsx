import Icon from "../icon";
import clsx from "clsx";
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "@wordpress/element";
import {
    ContextMenuContextType,
    ContextMenuItemProps,
    ContextMenuProps,
    ContextMenuSeparatorProps,
    ContextMenuSubmenuProps,
} from "./ContextMenu.type";

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(
    undefined,
);

export const useContextMenu = () => {
    const context = useContext(ContextMenuContext);

    if (!context) {
        throw new Error(
            "useContextMenu must be used within a ContextMenuProvider",
        );
    }

    return context;
};

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [activeMenu, setActiveMenu] = useState<{
        id: string;
        position: { x: number; y: number };
        props?: any;
        showCount: number;
    } | null>(null);

    const show = (
        id: string,
        event: React.MouseEvent<HTMLElement>,
        props?: any,
    ) => {
        event.preventDefault();
        setActiveMenu((prev) => ({
            id,
            position: { x: event.clientX, y: event.clientY },
            props,
            showCount: prev && prev.id === id ? prev.showCount + 1 : 1,
        }));
    };

    const hide = () => {
        setActiveMenu(null);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                hide();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        document.addEventListener("wheel", () => {
            hide();
        });

        document.addEventListener("click", () => {
            hide();
        });

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("wheel", () => {
                hide();
            });
        };
    }, [hide]);

    return (
        <ContextMenuContext.Provider value={{ show, hide, activeMenu }}>
            {children}
        </ContextMenuContext.Provider>
    );
};

const Menu: React.FC<ContextMenuProps> = ({
    id,
    style,
    className,
    children,
}) => {
    const { activeMenu, hide } = useContextMenu();
    const menuRef = useRef<HTMLDivElement>(null);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (activeMenu?.id === id) {
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 200);
            return () => clearTimeout(timer);
        }
    }, [activeMenu?.showCount, id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                hide();
            }
        };

        document.addEventListener("click", handleClickOutside as any);

        return () =>
            document.removeEventListener("click", handleClickOutside as any);
    }, [hide]);

    if (!activeMenu || activeMenu.id !== id) return null;

    const adjustPosition = () => {
        if (!menuRef.current)
            return { x: activeMenu.position.x, y: activeMenu.position.y };
        const rect = menuRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        let x = activeMenu.position.x;
        let y = activeMenu.position.y;

        if (x + rect.width > windowWidth) x = windowWidth - rect.width - 10;
        if (y + rect.height > windowHeight) y = windowHeight - rect.height - 10;

        return { x, y };
    };

    const { x, y } = adjustPosition();

    return (
        <div
            id={id}
            ref={menuRef}
            style={{ ...style, top: y, left: x, position: "fixed" }}
            className={clsx("pn-context-menu-content", className)}
            role="menu"
            aria-orientation="vertical"
            key={`menu-${id}-${activeMenu.showCount}`}
        >
            {children({ props: activeMenu?.props })}
        </div>
    );
};

const Item: React.FC<ContextMenuItemProps> = ({
    style,
    className = "",
    children,
    onClick,
    disabled,
}) => {
    const { activeMenu } = useContextMenu();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (disabled) return;
        onClick?.({ event, props: activeMenu?.props });
    };

    return (
        <div
            style={style}
            className={clsx(
                "pn-context-menu-item",
                disabled && "disabled",
                className,
            )}
            onClick={handleClick}
            role="menuitem"
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
        >
            {children}
        </div>
    );
};

const Separator: React.FC<ContextMenuSeparatorProps> = ({
    style,
    className,
}) => {
    return (
        <div
            style={style}
            className={clsx("pn-context-menu-separator", className)}
            role="separator"
        />
    );
};

const Submenu: React.FC<ContextMenuSubmenuProps> = ({
    trigger = "hover",
    label,
    style,
    className = "",
    children,
    disabled,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [animate, setAnimate] = useState(false);
    const closeTimeout = useRef<any>(null);

    const openMenu = () => {
        clearTimeout(closeTimeout.current);
        if (!disabled) setIsOpen(true);
    };

    const closeMenu = () => {
        closeTimeout.current = setTimeout(() => {
            setIsOpen(false);
        }, 60000);
    };

    useEffect(() => {
        if (trigger !== "click" || !isOpen) return;

        const handleOutsideClick = (e: MouseEvent) => {
            if (
                submenuRef.current?.contains(e.target as Node) ||
                triggerRef.current?.contains(e.target as Node)
            )
                return;

            setIsOpen(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, [trigger, isOpen]);

    useEffect(() => {
        if (isOpen && triggerRef.current && submenuRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const submenuRect = submenuRef.current.getBoundingClientRect();
            let x = triggerRect.right;
            let y = triggerRect.top;

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            if (x + submenuRect.width > windowWidth) {
                x = triggerRect.left - submenuRect.width;
            }

            if (y + submenuRect.height > windowHeight) {
                y = windowHeight - submenuRect.height - 10;
            }

            setPosition({ x, y });
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => clearTimeout(closeTimeout.current);
    }, []);

    return (
        <div
            className="pn-context-menu-sub"
            onMouseEnter={trigger === "hover" ? openMenu : undefined}
            onMouseLeave={trigger === "hover" ? closeMenu : undefined}
        >
            <div
                ref={triggerRef}
                style={style}
                className={clsx(
                    "pn-context-menu-sub-trigger",
                    disabled && "disabled",
                    className,
                )}
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={isOpen}
                tabIndex={disabled ? -1 : 0}
                onClick={
                    trigger === "click"
                        ? (e) => {
                              e.stopPropagation();
                              if (!disabled) setIsOpen((prev) => !prev);
                          }
                        : undefined
                }
            >
                {label}

                <Icon name="arrow_right" fontSize="lg" />
            </div>

            {isOpen && (
                <div
                    ref={submenuRef}
                    style={{
                        top: position.y,
                        left: position.x,
                        position: "fixed",
                        zIndex: 9999,
                    }}
                    className={clsx(
                        "pn-context-menu-sub-content",
                        animate && "animate",
                    )}
                    role="menu"
                    aria-orientation="vertical"
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export { Menu, Item, Separator, Submenu };
