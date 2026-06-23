import { iconFolderDefault, iconFolderDefaultOpen, iconFolderBold, iconFolderBoldOpen, iconFolderAwesome } from "~/utils/icons";
import SvgIcon from "~/components/svgIcon/SvgIcon";
import { Theme } from "~/types/settings/settings";
import { useMemo } from "@wordpress/element";

const ACTIVE_COLOR = "var(--pnpnm-primary)";
const DEFAULT_COLOR = "#697C8B";

const ThemeIcon = ({
    theme,
    open,
    color,
    active,
    drop,
}: {
    theme?: Theme;
    open?: boolean;
    color?: string | null;
    active?: boolean;
    drop?: boolean;
}) => {
    const iconElement = useMemo(() => {
        const resolvedColor = color || (active ? ACTIVE_COLOR : DEFAULT_COLOR);
        const defaultStyle = { color: resolvedColor };
        const customStyle = color ? { color } : undefined;

        if (drop) return <SvgIcon src={iconFolderDefaultOpen} style={defaultStyle} />;
        return open ? (
            <SvgIcon src={iconFolderDefaultOpen} style={defaultStyle} />
        ) : (
            <SvgIcon src={iconFolderDefault} style={defaultStyle} />
        );
    }, [theme, open, color, active, drop]);

    return iconElement;
};

export default ThemeIcon;
