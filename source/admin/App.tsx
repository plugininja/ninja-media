import { Navigate, Route, Routes } from "react-router-dom";
import Settings from "./settings/Settings";
import Files from "./files/Files";

const App = () => {
    return (
        <Routes>
            <Route path="*" element={<Navigate to="/files/all" replace />} />

            <Route path="/files/:menuKey/:dynamicKey?" element={<Files />} />

            <Route path="/settings/:menuKey" element={<Settings />} />
        </Routes>
    );
};

export default App;
