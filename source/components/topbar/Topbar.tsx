import { cloneElement, isValidElement } from "@wordpress/element";
import type { TopbarProps } from "./Topbar.type";
import { isValidArray } from "~/utils/utils";
import InlineStack from "../inlineStack";
import clsx from "clsx";

const Topbar = ({
    id,
    style,
    className = "",
    padding = 20,
    leftContents = [],
    rightContents = [],
}: TopbarProps) => {
    const renderContent = (item: React.ReactNode, index: number) => {
        if (!isValidElement(item)) return null;

        return cloneElement(item, {
            key: item.key ?? index,
        });
    };

    return (
        <InlineStack
            id={id}
            gap={10}
            align="between"
            style={{
                ...style,
                padding,
            }}
            className={clsx("pn-topbar", className)}
        >
            {isValidArray(leftContents) && (
                <InlineStack gap={10} className="flex-1">
                    {leftContents.map(renderContent)}
                </InlineStack>
            )}

            {isValidArray(rightContents) && (
                <InlineStack gap={10}>
                    {rightContents.map(renderContent)}
                </InlineStack>
            )}
        </InlineStack>
    );
};

export default Topbar;
