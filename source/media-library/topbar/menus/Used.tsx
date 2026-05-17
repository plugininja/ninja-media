import ThemeIcon from "~/shared/folder/ThemeIcon";
import { MenuItem } from "~/types/media/media";
import Folder from "~/shared/folder/Folder";
import Status from "~/components/status";

const Used = ({
    enabled,
    menu,
    theme,
    showCount,
    count,
}: MenuItem) => {
    if (!enabled) return null;

    return (
        <Status
            isPro={true}
            size="extrasmall"
            placement="right-center"
            right={3}
        >
            <Folder
                name="Used"
                count={showCount ? count : undefined}
                icon={
                    <ThemeIcon
                        theme={theme}
                        active={menu === "used"}
                        open={menu === "used"}
                    />
                }
                active={menu === "used"}
                open={menu === "used"}
                onClick={() => {
                }}
            />
        </Status>
    );
};

export default Used;
