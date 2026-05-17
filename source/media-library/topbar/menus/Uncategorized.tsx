import UncategorizedIcon from "~/assets/icons/folder/Uncategorized";
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
            icon={<UncategorizedIcon active={menu === "uncategorized"} />}
            active={menu === "uncategorized"}
            onClick={() => onMenu("uncategorized")}
        />
    );
};

export default Uncategorized;
