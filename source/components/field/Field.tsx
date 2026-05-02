import SettingsField from "../settingsField";
import { FieldProps } from "./Field.type";
import BlockStack from "../blockStack";
import { __ } from "@wordpress/i18n";
import Divider from "../divider";

const Field = ({
    id,
    style,
    className,
    gap = 20,
    title,
    description,
    docLink,
    statusProps,
    children,
}: FieldProps) => {
    return (
        <SettingsField
            padding={0}
            contentPadding={20}
            gap={0}
            title={title}
            titleSize="xl"
            description={description}
            docLink={docLink}
            statusProps={statusProps}
            isIgnoreChildren
        >
            <Divider />

            <BlockStack
                id={id}
                padding={20}
                gap={gap}
                style={style}
                className={className}
            >
                {children}
            </BlockStack>
        </SettingsField>
    );
};

export default Field;
