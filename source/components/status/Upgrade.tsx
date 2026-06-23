import BlockStack from "../blockStack";
import { __ } from "@wordpress/i18n";
import DOCS from "~/constants/docs";
import Text from "../text";
import Card from "../card";
import Icon from "../icon";
import { iconProIcon as iconPro } from "~/utils/icons";

const Upgrade = () => {
    return (
        <BlockStack gap={20} align="center" inlineAlign="center">
            <BlockStack
                align="center"
                inlineAlign="center"
                style={{
                    width: "150px",
                    height: "150px",
                }}
            >
                <img src={iconPro} alt="Upgrade to Pro" style={{ width: "100%", height: "100%" }} />
            </BlockStack>

            <Text
                size="2xl"
                weight="semibold"
                textTransform="uppercase"
                align="center"
            >
                {__("Upgrade to Pro", "ninja-media")}
            </Text>

            <Text color="descgray" align="center">
                {__(
                    "Upgrade to the Pro version of Ninja Media to unlock all the features and get access to premium support.",
                    "ninja-media",
                )}
            </Text>

            <Card
                padding="8px 13px"
                background="primary"
                flex
                gap={7}
                style={{
                    width: "fit-content",
                    borderRadius: "6px",
                    cursor: "pointer",
                }}
                onClick={() =>
                    window.open(DOCS?.pricingPage, "_blank", "noreferrer")
                }
            >
                <Icon color="pure" name="crown" fontSize="lg" />

                <Text color="pure" size="sm">
                    {__("Upgrade to pro", "ninja-media")}
                </Text>
            </Card>
        </BlockStack>
    );
};

export default Upgrade;
