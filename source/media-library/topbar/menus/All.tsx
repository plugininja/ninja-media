import { MenuItem } from "~/types/media/media";
import Home from "~/assets/icons/folder/Home";
import Folder from "~/shared/folder/Folder";

const All = ({ menu, showCount, count, onMenu }: MenuItem) => {
    return (
        <Folder
            name="All Files"
            count={showCount ? count : undefined}
            icon={<Home active={menu === "all"} />}
            active={menu === "all"}
            onClick={() => onMenu("all")}
        />
    );
};

export default All;
