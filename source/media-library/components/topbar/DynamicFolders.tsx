import { useLayoutEffect, useState } from "@wordpress/element";
import useScrollFade from "~/hooks/useScrollFade";
import BlockStack from "~/components/blockStack";
import Folder from "../folder/Folder";
import { Menu } from "~/types/media";
import clsx from "clsx";

const DynamicFolders = ({
    menu,
    setMenu,
    folders,
}: {
    menu: Menu;
    setMenu: (menu: Menu) => void;
    folders: Record<string, number>;
}) => {
    const [activeType, setActiveType] = useState<string>("");
    const { ref: scrollRef, showFade, checkFade } = useScrollFade();

    const active = menu === "dynamic";

    useLayoutEffect(() => {
        requestAnimationFrame(checkFade);
    }, [active]);

    const handleTypeClick = (key: string) => {
        setActiveType(key);

        window.pnpnmMedia?.initFilter(
            Object.entries(folders).map(([key, count]) => ({
                id: key,
                name: key,
                type: "dynamic",
            })),
        );

        window.pnpnmMedia
            ?.getFrame()
            ?.find("#pnpnm-media-folder-filter")
            ?.val(`dynamic_${key}`)
            ?.trigger("change");
    };

    return (
        <div className={clsx("pnpnm-dynamic-folders")}>
            <Folder
                name="Dynamic Folders"
                count={Object.keys(folders || {}).length}
                active={active}
                open={active}
                onClick={() => setMenu("dynamic")}
            />

            <div
                className={clsx(
                    "pnpnm-dynamic-folders__wrapper",
                    active &&
                        Object.keys(folders || {}).length > 0 &&
                        "pnpnm-dynamic-folders__wrapper--open",
                )}
            >
                <div
                    ref={scrollRef}
                    onScroll={checkFade}
                    className="pnpnm-dynamic-folders__container"
                >
                    <BlockStack
                        gap={5}
                        style={{
                            marginTop: 5,
                            paddingLeft: 10,
                        }}
                    >
                        {Object.entries(folders).map(([key, count]) => (
                            <Folder
                                key={key}
                                name={key}
                                count={count}
                                active={activeType === key}
                                open={activeType === key}
                                onClick={() => handleTypeClick(key)}
                            />
                        ))}
                    </BlockStack>
                </div>

                {showFade && <div className="pnpnm-dynamic-folders--fade" />}
            </div>
        </div>
    );
};

export default DynamicFolders;
