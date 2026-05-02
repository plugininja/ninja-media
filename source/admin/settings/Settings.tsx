import { selectSettings } from "~/redux/features/settings";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useNavigate, useParams } from "react-router-dom";
import { SETTINGS_MENUS } from "~/constants/menus";
import ToggleTheme from "~/components/toggleTheme";
import InlineStack from "~/components/inlineStack";
import Advanced from "./pages/advanced/Advanced";
import IconButton from "~/components/iconButton";
import { useEffect } from "@wordpress/element";
import { useAppSelector } from "~/redux/hooks";
import Display from "./pages/display/Display";
import General from "./pages/general/General";
import Sidebar from "~/components/sidebar";
import Button from "~/components/button";
import Topbar from "~/components/topbar";
import Layout from "~/components/layout";
import Tools from "./pages/tools/Tools";
import useSave from "~/hooks/useSave";
import Text from "~/components/text";

const Settings = () => {
    const { data } = useAppSelector(selectSettings);
    const [theme, setTheme] = useLocalStorage<"light" | "dark">(
        "pnpnm-theme-status",
        "light",
    );

    const { menuKey } = useParams();

    const navigate = useNavigate();

    const { isDataChanged, saveSettingsData } = useSave();

    useEffect(() => {
        if (data?.tools?.autoSave && isDataChanged) {
            saveSettingsData();
        }
    }, [data?.tools?.autoSave, isDataChanged]);

    const handleMenuClick = (key: (typeof SETTINGS_MENUS)[number]["key"]) => {
        navigate(`/settings/${key}`);
    };

    const topbarTitle = (
        <InlineStack gap={10}>
            <IconButton
                variant="secondary"
                rounded="md"
                color="primary"
                name={SETTINGS_MENUS?.find(({ key }) => key === menuKey)?.icon}
            />

            <Text color="primary" size="xl" weight="medium">
                {SETTINGS_MENUS?.find(({ key }) => key === menuKey)?.title}
            </Text>
        </InlineStack>
    );

    const themeButton = <ToggleTheme theme={theme} setTheme={setTheme} />;

    const save = (
        <Button
            variant="primary"
            startIcon="check"
            onClick={() => saveSettingsData()}
            disabled={!isDataChanged}
        >
            Save Settings
        </Button>
    );

    const renderPage = () => {
        const pageComponents: Record<string, JSX.Element> = {
            general: <General />,
            display: <Display />,
            advanced: <Advanced />,
            tools: <Tools />,
        };

        return pageComponents[menuKey!] || <General />;
    };

    return (
        <Layout>
            <Sidebar>
                <Sidebar.Menu>
                    {SETTINGS_MENUS?.map(({ key, title, icon }, index) => (
                        <Sidebar.Item
                            key={key ?? index}
                            title={title}
                            icon={icon}
                            active={key === menuKey}
                            onClick={() => handleMenuClick(key)}
                        />
                    ))}
                </Sidebar.Menu>

                <Sidebar.Bottom>
                    <Sidebar.HelpCenter />
                </Sidebar.Bottom>
            </Sidebar>

            <Layout.Wrapper>
                <Topbar
                    leftContents={[topbarTitle]}
                    rightContents={[themeButton, save]}
                />

                <Layout.Content>{renderPage()}</Layout.Content>
            </Layout.Wrapper>
        </Layout>
    );
};

export default Settings;
