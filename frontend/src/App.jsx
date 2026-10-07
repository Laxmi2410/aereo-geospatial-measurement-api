import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext';

// Import pages (we will create these soon)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';

const ProtectedRoute = ({ children }) => {
    const { token } = useContext(AppContext);
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const App = () => {
    return (
        <div className="app-container">
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="budgets" element={<Budgets />} />
                </Route>
            </Routes>
        </div>
    );
};

export default App;
