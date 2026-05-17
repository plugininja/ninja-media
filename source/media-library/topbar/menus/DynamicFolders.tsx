import ThemeIcon from "~/shared/folder/ThemeIcon";
import { Theme } from "~/types/settings/settings";
import { MediaMenu } from "~/types/media/media";
import Folder from "~/shared/folder/Folder";
import Status from "~/components/status";
import clsx from "clsx";

const DynamicFolders = ({
    enabled,
    menu,
    theme,
    folders,
    showCount,
}: {
    enabled?: boolean;
    menu: MediaMenu;
    theme?: Theme;
    folders: Record<string, number>;
    showCount?: boolean;
}) => {
    const active = menu === "dynamic";

    if (!enabled) return null;

    return (
        <div className={clsx("pnpnm-dynamic-folders")}>
            <Status
                isPro={true}
                size="extrasmall"
                placement="right-center"
                right={3}
            >
                <Folder
                    name="Dynamic Folders"
                    count={
                        showCount
                            ? Object.keys(folders || {}).length
                            : undefined
                    }
                    icon={
                        <ThemeIcon
                            theme={theme}
                            active={active}
                            open={active}
                        />
                    }
                    active={active}
                    open={active}
                    onClick={() => {
                    }}
                />
            </Status>

        </div>
    );
};

export default DynamicFolders;
