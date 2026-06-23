import Description from "../description";
import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import { __ } from "@wordpress/i18n";
import Status from "../status";
import Button from "../button";
import Card from "../card";
import Text from "../text";
import clsx from "clsx";
import {
    SettingsFieldProps,
    SettingsSubFieldProps,
} from "./SettingsField.type";

const SettingsField: SettingsFieldProps = ({
    id,
    style,
    className,
    title,
    titleSize = "md",
    description,
    docLink,
    background = "white",
    border = "light",
    borderStyle,
    rounded,
    padding = 20,
    contentPadding,
    fullWidth = false,
    gap = 20,
    children,
    isIgnoreChildren = false,
    action,
    secondaryAction,
    statusProps,
}) => {
    return (
        <Card
            id={id}
            style={style}
            padding={padding}
            background={background}
            border={border}
            borderStyle={borderStyle}
            rounded={rounded}
            statusProps={statusProps}
            className={className}
        >
            <InlineStack
                padding={contentPadding}
                align="between"
                gap={10}
                style={{
                    marginBottom:
                        children &&
                        !isIgnoreChildren &&
                        (title || description || action || secondaryAction)
                            ? 16
                            : 0,
                }}
            >
                <BlockStack gap={10} className={clsx(fullWidth && "w-full")}>
                    <InlineStack
                        gap={15}
                        className={clsx(fullWidth && "w-full")}
                    >
                        {action && action}

                        {title &&
                            (statusProps?.isPro ? (
                                <InlineStack gap={10} wrap={false}>
                                    <Text
                                        as="h4"
                                        size={titleSize}
                                        weight="medium"
                                    >
                                        {title}
                                    </Text>

                                    <Status.Pro tooltipDisabled />
                                </InlineStack>
                            ) : (
                                <Text as="h4" size={titleSize} weight="medium">
                                    {title}
                                </Text>
                            ))}

                        {secondaryAction && secondaryAction}
                    </InlineStack>

                    {description && <Description text={description} />}
                </BlockStack>

                {docLink && (
                    <Button
                        variant="outlined"
                        size="extrasmall"
                        startIcon="info"
                        href={docLink}
                        target="_blank"
                    >
                        {__("Documentation", "ninja-media")}
                    </Button>
                )}
            </InlineStack>

            <BlockStack gap={gap}>{children}</BlockStack>
        </Card>
    );
};

const SettingsSubField: React.FC<SettingsSubFieldProps> = ({
    id,
    style,
    className,
    title,
    description,
    docLink,
    background = "extralight",
    border,
    borderStyle = "dashed",
    rounded = "md",
    gap = 20,
    children,
    action,
    secondaryAction,
    isIgnoreChildren,
    depend,
    dependOn = "",
    dependOnExact = false,
    statusProps,
}) => {
    const classes = clsx(className, depend && "pn-settings-field-disabled");

    const handleClick = (e: React.MouseEvent) => {
        const dependent = document.getElementById(dependOn);

        if (dependent && depend) {
            e.stopPropagation();

            const label = dependOnExact
                ? dependent
                : (dependent.parentElement as HTMLElement);

            if (!label) return;

            label.classList.add("pn-blink");

            setTimeout(() => {
                label.classList.remove("pn-blink");
            }, 500);
        }
    };

    return (
        <Card
            id={id}
            style={style}
            background={background}
            border={border}
            borderStyle={borderStyle}
            rounded={rounded}
            statusProps={statusProps}
            className={classes}
            onClick={handleClick}
        >
            <InlineStack
                align="between"
                gap={10}
                style={{
                    marginBottom:
                        children &&
                        !isIgnoreChildren &&
                        (title || description || action || secondaryAction)
                            ? 16
                            : 0,
                }}
            >
                <BlockStack gap={10}>
                    <InlineStack gap={15}>
                        {action && action}

                        {title && (
                            <Text as="h4" weight="medium">
                                {title}
                            </Text>
                        )}

                        {secondaryAction && secondaryAction}
                    </InlineStack>

                    {description && <Description text={description} />}
                </BlockStack>

                {docLink && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon="info"
                        href={docLink}
                        target="_blank"
                    >
                        {__("Documentation", "ninja-media")}
                    </Button>
                )}
            </InlineStack>

            <BlockStack gap={gap}>{children}</BlockStack>
        </Card>
    );
};

SettingsField.SubField = SettingsSubField;

export default SettingsField;
