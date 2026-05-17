import InlineStack from "../inlineStack";
import BlockStack from "../blockStack";
import DOCS from "~/constants/docs";
import Card from "../card";
import Icon from "../icon";
import Text from "../text";
import Logo from "../logo";

const PremiumCard = ({
    compact,
    style,
}: {
    compact?: boolean;
    style?: React.CSSProperties;
}) => {
    const featuresToShow = compact ? FEATURES.slice(0, 5) : FEATURES;

    return (
        <Card
            padding={15}
            flex
            direction="col"
            gap={10}
            style={{
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
            className="pn-sidebar__fade"
        >
            <Card
                padding="35px 10px 10px 10px"
                background="primary"
                style={{
                    width: "fit-content ",
                    position: "absolute",
                    top: -20,
                    right: -15,
                    transform: "rotate(5deg)",
                    zIndex: 10,
                    borderRadius: "14px",
                }}
            >
                <Text
                    color="pure"
                    size="sm"
                    style={{
                        paddingRight: "15px",
                    }}
                >
                    Click To Get Special Offer
                </Text>
            </Card>

            <BlockStack marginTop={35} gap={10}>
                <Logo />

                <Text color="descgray">Unlock advanced features:</Text>
            </BlockStack>

            <BlockStack marginTop={10} gap={16}>
                {featuresToShow?.map(({ title }, index) => (
                    <InlineStack key={index} gap={10} wrap={false}>
                        <Icon name="check" color="primary" />

                        <Text color="secondaryblack" size="sm">
                            {title}
                        </Text>
                    </InlineStack>
                ))}
            </BlockStack>

            <Card
                marginTop={10}
                padding={10}
                background="pro"
                rounded="md"
                flex
                align="center"
                blockAlign="center"
                gap={10}
                style={{
                    cursor: "pointer",
                    userSelect: "none",
                }}
                onClick={() =>
                    window.open(
                        DOCS?.pricingPage,
                        "_blank",
                        "noopener noreferrer",
                    )
                }
            >
                <Icon name="upgrade" color="dark" fontSize="xl" />

                <Text color="dark" size="sm">
                    Upgrade to Pro
                </Text>
            </Card>
        </Card>
    );
};

export default PremiumCard;

const FEATURES: { title: string }[] = [
    {
        title: "Post Type Folder",
    },
    {
        title: "Dynamic Folders",
    },
    {
        title: "Replace Media",
    },
    {
        title: "Convert To WebP",
    },
    {
        title: "Watermark For Images",
    },
    {
        title: "Folder Custom Color",
    },
    {
        title: "3 Awesome Theme",
    },
    {
        title: "Show Folder ID",
    },
    {
        title: "Unused Files",
    },
];
