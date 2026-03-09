import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";
import Dashboard from "./pages/Dashboard";
import Profiles from "./pages/Profiles";
import Groups from "./pages/Groups";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import { useSingBox } from "./hooks/useSingBox";

function AppContent() {
  // Initialize sing-box event listeners
  useSingBox();

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-900">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-white dark:bg-zinc-900">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
