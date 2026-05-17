import ThemeIcon from "~/shared/folder/ThemeIcon";
import { MenuItem } from "~/types/media/media";
import Folder from "~/shared/folder/Folder";
import Status from "~/components/status";

const Favorites = ({
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
                name="Favorites"
                count={showCount ? count : undefined}
                icon={
                    <ThemeIcon
                        theme={theme}
                        active={menu === "favorites"}
                        open={menu === "favorites"}
                    />
                }
                active={menu === "favorites"}
                open={menu === "favorites"}
                onClick={() => {
                }}
            />
        </Status>
    );
};

export default Favorites;
