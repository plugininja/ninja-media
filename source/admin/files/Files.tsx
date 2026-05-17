import PremiumCard from "~/components/status/PremiumCard";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import FilesContainer from "./components/FilesContainer";
import ToggleTheme from "~/components/toggleTheme";
import Upgrade from "~/components/status/Upgrade";
import { FILES_MENUS } from "~/constants/menus";
import { useEffect } from "@wordpress/element";
import { useAppDispatch } from "~/redux/hooks";
import Sidebar from "~/components/sidebar";
import Layout from "~/components/layout";
import Topbar from "~/components/topbar";
import Search from "./components/Search";
import Header from "./components/Header";
import Button from "~/components/button";
import { file } from "~/redux/api/file";
import useFile from "./hooks/useFile";
import { __ } from "@wordpress/i18n";
import Icon from "~/components/icon";
import clsx from "clsx";

const Files = () => {
    const [theme, setTheme] = useLocalStorage<"light" | "dark">(
        "pnpnm-theme-status",
        "light",
    );
    const { setFile, count, loading } = useFile();

    const { menuKey, dynamicKey } = useParams();

    const navigate = useNavigate();

    const dispatch = useAppDispatch();

    const enableTrash = pnpnm?.settings?.general?.files?.moveToTrash ?? false;

    useEffect(() => {
        if (menuKey === "trash" && !enableTrash) {
            navigate("/files/all");
        }
    }, [menuKey, enableTrash]);

    const handleMenuClick = (key: (typeof FILES_MENUS)[number]["key"]) => {
        navigate(`/files/${key}`);
    };

    const search = <Search />;

    const refresh = (
        <Button
            variant="primary"
            onClick={() => {
                if (loading) return;

                setFile("loading", true);
                setFile("query.page", 1);
                dispatch(file.util.invalidateTags(["Files"]));
            }}
        >
            <Icon
                name="refresh"
                color="pure"
                fontSize="lg"
                className={clsx(loading && "loading")}
            />
            {__("Refresh", "advanced-media-library")}
        </Button>
    );

    const themeButton = <ToggleTheme theme={theme} setTheme={setTheme} />;

    return (
        <Layout>
            <Sidebar minWidth={320}>
                <Sidebar.Menu>
                    {FILES_MENUS?.map(({ key, title, icon }, index) => (
                        <Sidebar.Item
                            key={key ?? index}
                            title={
                                key === "dynamic" && dynamicKey
                                    ? `Dynamic Files (${dynamicKey})`
                                    : title
                            }
                            icon={icon}
                            count={count[key as keyof typeof count] ?? 0}
                            active={key === menuKey}
                            onClick={() => handleMenuClick(key)}
                        />
                    ))}
                </Sidebar.Menu>

                {!pnpnm.isPro && (
                    <PremiumCard compact style={{ marginTop: 10 }} />
                )}

                <Sidebar.Bottom
                    trash
                    trashCount={count?.trash}
                    trashActive={menuKey === "trash"}
                    trashClick={() => {
                    }}
                    disabledTrash={!enableTrash}
                >
                    <Sidebar.Trash
                        active={menuKey === "trash"}
                        count={count?.trash}
                        onClick={() => {
                        }}
                        disabled={!enableTrash}
                    />

                    <Sidebar.HelpCenter />
                </Sidebar.Bottom>
            </Sidebar>

            <Layout.Wrapper>
                <Topbar
                    leftContents={[search]}
                    rightContents={[themeButton, refresh]}
                />

                <Layout.Content>
                    {pnpnm?.isPro ? (
                        <>
                            <Header />

                            <FilesContainer />
                        </>
                    ) : ["all", "uncategorized"].includes(menuKey!) ? (
                        <>
                            <Header />

                            <FilesContainer />
                        </>
                    ) : (
                        <Upgrade />
                    )}
                </Layout.Content>
            </Layout.Wrapper>
        </Layout>
    );
};

export default Files;
