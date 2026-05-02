import { PageContainerProps } from "./PageContainer.type";
import Description from "../description";
import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import { __ } from "@wordpress/i18n";
import Button from "../button";
import Text from "../text";

const PageContainer = ({
    id,
    style,
    className,
    gap = 20,
    title,
    description,
    docLink,
    module,
    children,
}: PageContainerProps) => {
    return (
        <BlockStack
            id={id}
            style={{
                ...style,
                ...(module ? { marginBottom: "80px" } : {}),
            }}
            gap={gap}
            className={className}
        >
            {(title || description) && (
                <InlineStack gap={5} align="between">
                    <BlockStack gap={10}>
                        <Text as="h2" weight="semibold" size="lg">
                            {title}
                        </Text>

                        <Description text={description} />
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
            )}

            <BlockStack gap={20}>{children}</BlockStack>
        </BlockStack>
    );
};

export default PageContainer;
