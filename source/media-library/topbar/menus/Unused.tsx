import ThemeIcon from "~/shared/folder/ThemeIcon";
import { MenuItem } from "~/types/media/media";
import Folder from "~/shared/folder/Folder";
import Status from "~/components/status";

const Unused = ({
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
                name="Unused"
                count={showCount ? count : undefined}
                icon={
                    <ThemeIcon
                        theme={theme}
                        active={menu === "unused"}
                        open={menu === "unused"}
                    />
                }
                active={menu === "unused"}
                open={menu === "unused"}
                onClick={() => {
                }}
            />
        </Status>
    );
};

export default Unused;
