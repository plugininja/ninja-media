import { useCustomAlert } from "~/components/alert/Alert";
import BlockStack from "~/components/blockStack";
import ProIcon from "~/assets/icons/ProIcon";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";

export function UpgradeContent() {
    return (
        <div>
            <BlockStack gap={20} align="center" inlineAlign="center">
                <ProIcon />

                <Text
                    size="2xl"
                    weight="semibold"
                    textTransform="uppercase"
                    align="center"
                >
                    Upgrade to Pro
                </Text>

                <Text color="descgray" align="center">
                    Upgrade to the Pro version of Accessiy to unlock all the
                    features and get access to premium support.
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
                        window.open(pnpnm.upgradeUrl, "_blank", "noreferrer")
                    }
                >
                    <Icon color="pure" name="crown" fontSize="lg" />

                    <Text color="pure" size="sm">
                        Upgrade to pro
                    </Text>
                </Card>
            </BlockStack>
        </div>
    );
}

export function useUpgradePopUp() {
    const { showAlert } = useCustomAlert();

    const showUpgradePopUp = () => {
        showAlert({
            id: "upgrade-modal",
            type: "warning",
            showIcon: false,
            showConfirmButton: false,
            showCancelButton: false,
            allowOutsideClick: true,
            allowEscapeKey: true,
            width: "450px",
            height: "fit-content",
            html: <UpgradeContent />,
        });
    };

    return { showUpgradePopUp };
}
