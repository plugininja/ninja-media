import { selectSettings } from "~/redux/features/settings";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import FilesContainer from "./components/FilesContainer";
import { selectFiles } from "~/redux/features/files";
import ToggleTheme from "~/components/toggleTheme";
import { FILES_MENUS } from "~/constants/menus";
import { useEffect } from "@wordpress/element";
import { useAppSelector } from "~/redux/hooks";
import Sidebar from "~/components/sidebar";
import Layout from "~/components/layout";
import Topbar from "~/components/topbar";
import Search from "./components/Search";
import Header from "./components/Header";

const Files = () => {
    const [theme, setTheme] = useLocalStorage<"light" | "dark">(
        "pnpnm-theme-status",
        "light",
    );
    const { data } = useAppSelector(selectSettings);
    const { count } = useAppSelector(selectFiles);

    const { menuKey, dynamicKey } = useParams();

    const navigate = useNavigate();

    const enableTrash =
        data?.general?.files?.moveToTrash ??
        pnpnm?.settings?.general?.files?.moveToTrash ??
        false;

    useEffect(() => {
        if (menuKey === "trash" && !enableTrash) {
            navigate("/files/all");
        }
    }, [menuKey, enableTrash]);

    const handleMenuClick = (key: (typeof FILES_MENUS)[number]["key"]) => {
        navigate(`/files/${key}`);
    };

    const search = <Search />;

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

                <Sidebar.Bottom
                    trash
                    trashCount={count?.trash}
                    trashActive={menuKey === "trash"}
                    trashClick={() => {
                        navigate("/files/trash");
                    }}
                    disabledTrash={!enableTrash}
                >
                    <Sidebar.Trash
                        active={menuKey === "trash"}
                        count={count?.trash}
                        onClick={() => {
                            navigate("/files/trash");
                        }}
                        disabled={!enableTrash}
                    />

                    <Sidebar.HelpCenter />
                </Sidebar.Bottom>
            </Sidebar>

            <Layout.Wrapper>
                <Topbar leftContents={[search]} rightContents={[themeButton]} />

                <Layout.Content>
                    <Header />

                    <FilesContainer />
                </Layout.Content>
            </Layout.Wrapper>
        </Layout>
    );
};

export default Files;
