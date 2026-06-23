import { iconFolderUncategorized } from "~/utils/icons";
import SvgIcon from "~/components/svgIcon/SvgIcon";
import { MenuItem } from "~/types/media/media";
import Folder from "~/shared/folder/Folder";

const Uncategorized = ({
    enabled,
    menu,
    showCount,
    count,
    onMenu,
}: MenuItem) => {
    if (!enabled) return null;

    return (
        <Folder
            name="Uncategorized"
            count={showCount ? count : undefined}
            icon={<SvgIcon src={iconFolderUncategorized} style={{ color: menu === "uncategorized" ? "var(--pnpnm-primary)" : "#697C8B" }} />}
            active={menu === "uncategorized"}
            onClick={() => onMenu("uncategorized")}
        />
    );
};

export default Uncategorized;
