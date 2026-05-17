import { useEffect } from "@wordpress/element";
import AppLayout from "./AppLayout";

const App = () => {
    useEffect(() => {
        if (!pnpnm?.settings?.display?.theme?.firstTime) return;

        const root = document?.documentElement;

        root?.style.setProperty("--pnpnm-primary", "#2271b1");
    }, []);

    return <AppLayout />;
};

export default App;
