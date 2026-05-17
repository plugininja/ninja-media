import PremiumCard from "~/components/status/PremiumCard";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { WATERMARK_MENUS } from "~/constants/menus";
import ToggleTheme from "~/components/toggleTheme";
import InlineStack from "~/components/inlineStack";
import Upgrade from "~/components/status/Upgrade";
import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import TextComponent from "~/components/text";
import Sidebar from "~/components/sidebar";
import Layout from "~/components/layout";
import Topbar from "~/components/topbar";
import { __ } from "@wordpress/i18n";

const Watermark = () => {
    const [theme, setTheme] = useLocalStorage<"light" | "dark">(
        "pnpnm-theme-status",
        "light",
    );

    const { menuKey } = useParams();

    const navigate = useNavigate();

    const handleMenuClick = (key: (typeof WATERMARK_MENUS)[number]["key"]) => {
        navigate(`/watermark/${key}`);
    };

    const topbarTitle = (
        <InlineStack gap={10}>
            <IconButton
                variant="secondary"
                rounded="md"
                color="primary"
                name={WATERMARK_MENUS?.find(({ key }) => key === menuKey)?.icon}
            />

            <TextComponent color="primary" size="xl" weight="medium">
                {WATERMARK_MENUS?.find(({ key }) => key === menuKey)?.title}
            </TextComponent>
        </InlineStack>
    );

    const themeButton = <ToggleTheme theme={theme} setTheme={setTheme} />;

    const topbarRightContents = [themeButton];

    return (
        <Layout>
            <Sidebar minWidth={300}>
                <Sidebar.Menu>
                    {WATERMARK_MENUS?.map(({ key, title, icon }, index) => (
                        <Sidebar.Item
                            key={key ?? index}
                            title={title}
                            icon={icon}
                            active={key === menuKey}
                            onClick={() => handleMenuClick(key)}
                        />
                    ))}
                </Sidebar.Menu>

                {!pnpnm.isPro && (
                    <BlockStack
                        align="center"
                        inlineAlign="center"
                        className="h-full"
                    >
                        <PremiumCard />
                    </BlockStack>
                )}

                <Sidebar.Bottom>
                    <Sidebar.HelpCenter />

                    {!pnpnm.isPro && <Sidebar.UpgradePro />}
                </Sidebar.Bottom>
            </Sidebar>

            <Layout.Wrapper>
                <Topbar
                    leftContents={[topbarTitle]}
                    rightContents={topbarRightContents}
                />

                <Layout.Content>
                    {!pnpnm?.isPro && <Upgrade />}

                </Layout.Content>
            </Layout.Wrapper>
        </Layout>
    );
};

export default Watermark;
