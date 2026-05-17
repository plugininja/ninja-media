import { Navigate, Route, Routes } from "react-router-dom";
import Watermark from "./watermark/Watermark";
import Settings from "./settings/Settings";
import Files from "./files/Files";

const App = () => {
    return (
        <Routes>
            <Route path="*" element={<Navigate to="/files/all" replace />} />

            <Route path="/files/:menuKey/:dynamicKey?" element={<Files />} />
            
            <Route path="/settings/:menuKey" element={<Settings />} />

            <Route path="/watermark/:menuKey" element={<Watermark />} />
        </Routes>
    );
};

export default App;
