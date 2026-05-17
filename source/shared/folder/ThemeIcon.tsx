import DefaultOpen from "~/assets/icons/folder/DefaultOpen";
import Default from "~/assets/icons/folder/NinjaDefault";
import { Theme } from "~/types/settings/settings";
import { useMemo } from "@wordpress/element";

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
        if (drop) return <DefaultOpen color={color} active={active ?? false} />;
        return open ? (
            <DefaultOpen color={color} active={active ?? false} />
        ) : (
            <Default color={color} active={active ?? false} />
        );
    }, [theme, open, color, active, drop]);

    return iconElement;
};

export default ThemeIcon;
