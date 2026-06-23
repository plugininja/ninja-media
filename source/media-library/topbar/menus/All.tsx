import { MenuItem } from "~/types/media/media";
import { iconFolderHome } from "~/utils/icons";
import SvgIcon from "~/components/svgIcon/SvgIcon";
import Folder from "~/shared/folder/Folder";

const All = ({ menu, showCount, count, onMenu }: MenuItem) => {
    return (
        <Folder
            name="All Files"
            count={showCount ? count : undefined}
            icon={<SvgIcon src={iconFolderHome} style={{ color: menu === "all" ? "var(--pnpnm-primary)" : "#697C8B" }} />}
            active={menu === "all"}
            onClick={() => onMenu("all")}
        />
    );
};

export default All;
