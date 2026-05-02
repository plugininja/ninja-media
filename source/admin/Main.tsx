import { CustomAlertProvider } from "~/components/alert/Alert";
import { HashRouter } from "react-router-dom";
import MainRoute from "~/routes/MainRoute";
import { Provider } from "react-redux";
import { store } from "~/redux/store";
import App from "./App";

const Main = () => {
    return (
        <HashRouter>
            <Provider store={store}>
                <CustomAlertProvider>
                    <MainRoute>
                        <App />
                    </MainRoute>
                </CustomAlertProvider>
            </Provider>
        </HashRouter>
    );
};

export default Main;
