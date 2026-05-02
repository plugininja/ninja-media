import InlineStack from "../inlineStack";
import Icon from "../icon";
import Text from "../text";
import clsx from "clsx";
import type {
    DropdownComponent,
    DropdownProps,
    DropdownMenuContextType,
    DropdownTriggerProps,
    DropdownSubProps,
    DropdownMenuItemProps,
    DropdownTriggerArrowProps,
} from "./Dropdown.type";
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "@wordpress/element";

const DropdownContext = createContext<DropdownMenuContextType | undefined>(
    undefined,
);

const useDropdownContext = () => {
    const context = useContext(DropdownContext);

    if (!context) {
        throw new Error(
            "useDropdownContext must be used within a Dropdown component",
        );
    }

    return context;
};

const Dropdown: DropdownComponent = ({
    children,
    style,
    className = "",
    outSideClick = true,
}: DropdownProps) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!outSideClick) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <DropdownContext.Provider value={{ open, setOpen }}>
            <div
                style={style}
                className={clsx("pn-dropdown", className)}
                ref={wrapperRef}
            >
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

const Trigger = ({
    children,
    openStatus,
    style,
    className = "",
    disabled = false,
}: DropdownTriggerProps) => {
    const { open, setOpen } = useDropdownContext();

    useEffect(() => {
        if (openStatus !== undefined) {
            setOpen(openStatus);
        }
    }, [openStatus]);

    return (
        <div
            style={style}
            className={clsx("pn-dropdown__trigger", className)}
            onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                setOpen(!open);
            }}
        >
            {typeof children === "function"
                ? children({ open, setOpen })
                : children}
        </div>
    );
};

const TriggerArrow = ({
    style,
    arrowColor = "black",
    arrowSize = "lg",
}: DropdownTriggerArrowProps) => {
    const { open } = useDropdownContext();

    return (
        <div
            style={style}
            className={clsx("pn-dropdown__trigger-arrow", {
                "pn-dropdown__trigger-arrow--active": open,
            })}
        >
            <Icon
                name="keyboard_arrow_down"
                color={arrowColor}
                fontSize={arrowSize}
                fontWeight="semibold"
            />
        </div>
    );
};

const Content = ({
    style,
    className = "",
    rounded = "md",
    border = false,
    borderColor = "light",
    borderStyle = "solid",
    shadow = true,
    fullWidth,
    children,
    position,
}: DropdownSubProps) => {
    const { open, setOpen } = useDropdownContext();
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open || !contentRef.current) return;

        if (position) return;

        const content = contentRef.current;
        const trigger = content.parentElement?.querySelector(
            ".pn-dropdown__trigger",
        );
        if (!trigger) return;

        const triggerRect = trigger.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();

        content.style.left = "0";
        content.style.right = "auto";
        content.style.top = "calc(100% + 5px)";
        content.style.bottom = "auto";

        if (triggerRect.right + contentRect.width > window.innerWidth) {
            content.style.left = "auto";
            content.style.right = "0";
        }

        if (triggerRect.bottom + contentRect.height > window.innerHeight) {
            content.style.top = "auto";
            content.style.bottom = "calc(100% + 5px)";
        }
    }, [open]);

    return (
        <div
            ref={contentRef}
            style={{ ...style, ...(position || {}) }}
            className={clsx(
                "pn-dropdown__content",
                `rounded-${rounded}`,
                border && `border border-${borderColor} border-${borderStyle}`,
                className,
                {
                    "pn-dropdown__content--active": open,
                    "pn-dropdown__content--full": fullWidth,
                    "pn-dropdown__content--shadow": shadow,
                },
            )}
        >
            {typeof children === "function"
                ? children({ open, setOpen })
                : children}
        </div>
    );
};

const MenuLabel = ({
    className = "",
    children,
    tag = "p",
}: DropdownSubProps) => {
    const { open, setOpen } = useDropdownContext();

    return (
        <Text as={tag} className={clsx("pn-dropdown__menu-label", className)}>
            {typeof children === "function"
                ? children({ open, setOpen })
                : children}
        </Text>
    );
};

const MenuSeparator = () => {
    return <div className="pn-dropdown__menu-separator"></div>;
};

const MenuItem = ({
    title,
    children,
    onClick,
    isActive,
    activeIcon = false,
    iconPosition = "left",
    activeBg = false,
    style,
    className = "",
}: DropdownMenuItemProps) => {
    return (
        <div
            title={title}
            style={style}
            className={clsx("pn-dropdown__menu-item", className, {
                "pn-dropdown__menu-item--active": isActive,
                "pn-dropdown__menu-item--activeBg": activeBg,
            })}
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
        >
            {activeIcon ? (
                <InlineStack
                    gap={5}
                    align={iconPosition === "left" ? "start" : "between"}
                    direction={iconPosition === "left" ? "row" : "row-reverse"}
                    wrap={false}
                    className="w-full"
                >
                    <div className="pn-dropdown__menu-item-icon">
                        {isActive && <Icon name="check" fontSize="md" />}
                    </div>
                    {children}
                </InlineStack>
            ) : (
                children
            )}
        </div>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.TriggerArrow = TriggerArrow;
Dropdown.Content = Content;
Dropdown.MenuLabel = MenuLabel;
Dropdown.MenuSeparator = MenuSeparator;
Dropdown.MenuItem = MenuItem;

export default Dropdown;
