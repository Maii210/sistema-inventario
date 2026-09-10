import { AppProvider } from './contexts/AppContext';
import { AdminPanel } from './components/Admin/AdminPanel';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-white font-inter">
        <AdminPanel />
      </div>
    </AppProvider>
  );
}

export default App;
