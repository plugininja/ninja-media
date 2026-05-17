import Divider from "~/components/divider";
import Controls from "./blocks/Controls";
import Header from "./blocks/Header";
import Search from "./blocks/Search";
import Menus from "./menus/Menus";

const Topbar = () => {
    return (
        <div className="pnpnm-topbar">
            <Header />

            <Controls />

            <Menus />

            <Divider marginTop={10} marginBottom={10} />

            <Search />

            <Divider marginTop={10} />
        </div>
    );
};

export default Topbar;
