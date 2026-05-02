import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import Tooltip from "~/components/tooltip";
import Card from "~/components/card";
import Text from "~/components/text";
import Icon from "~/components/icon";

const FileLocations = ({
    FLEX_VALUES,
    location,
}: {
    FLEX_VALUES: string[];
    location: {
        name: string;
        url: string;
    }[];
}) => {
    const component = (
        <BlockStack padding={5} gap={10}>
            {location?.map(({ name, url }, index) => (
                <InlineStack key={index} gap={10} wrap={false}>
                    <Text size="sm" wrap={false}>
                        {index + 1}.
                    </Text>

                    <Text size="sm" wrap={false}>
                        {name}
                    </Text>

                    <Icon
                        name="open_in_new"
                        color="primary"
                        style={{
                            cursor: "pointer",
                        }}
                        onClick={() => window.open(url, "_blank")}
                    />
                </InlineStack>
            ))}
        </BlockStack>
    );

    const notFound = (
        <BlockStack padding={5}>
            <Text size="sm" wrap={false}>
                Locations not Found
            </Text>
        </BlockStack>
    );

    return (
        <BlockStack
            inlineAlign="center"
            style={{
                flex: FLEX_VALUES[3],
            }}
        >
            <Tooltip
                arrow
                background="white"
                shadow
                style={{
                    width: "fit-content",
                }}
                component={location?.length > 0 ? component : notFound}
            >
                <Card
                    padding={5}
                    rounded="md"
                    flex
                    align="center"
                    blockAlign="center"
                    style={{
                        minWidth: "40px",
                        width: "fit-content",
                        height: "40px",
                        aspectRatio: "1 / 1",
                    }}
                >
                    {location?.length ?? 0}
                </Card>
            </Tooltip>
        </BlockStack>
    );
};

export default FileLocations;
