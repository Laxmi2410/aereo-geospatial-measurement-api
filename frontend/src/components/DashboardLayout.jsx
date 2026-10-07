import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
    FiHome, 
    FiList, 
    FiPieChart, 
    FiTarget, 
    FiLogOut, 
    FiMoon, 
    FiSun 
} from 'react-icons/fi';

const DashboardLayout = () => {
    const { user, logout, theme, toggleTheme } = useContext(AppContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarStyle = {
        width: '250px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        height: '100vh',
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
    };

    const navItemStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.5rem',
        color: 'var(--color-text-secondary)',
        transition: 'all var(--transition-fast)',
        fontWeight: '500',
    };

    const activeStyle = {
        backgroundColor: 'var(--color-primary)',
        color: 'white',
    };

    const mainContentStyle = {
        marginLeft: '250px',
        padding: '2rem',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
    };

    return (
        <div style={{ display: 'flex' }}>
            <div style={sidebarStyle}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                        E
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>ExpensePro</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <NavLink to="/dashboard" end style={({ isActive }) => isActive ? { ...navItemStyle, ...activeStyle } : navItemStyle}>
                        <FiHome style={{ marginRight: '0.75rem' }} /> Dashboard
                    </NavLink>
                    <NavLink to="/dashboard/transactions" style={({ isActive }) => isActive ? { ...navItemStyle, ...activeStyle } : navItemStyle}>
                        <FiList style={{ marginRight: '0.75rem' }} /> Transactions
                    </NavLink>
                    <NavLink to="/dashboard/analytics" style={({ isActive }) => isActive ? { ...navItemStyle, ...activeStyle } : navItemStyle}>
                        <FiPieChart style={{ marginRight: '0.75rem' }} /> Analytics
                    </NavLink>
                    <NavLink to="/dashboard/budgets" style={({ isActive }) => isActive ? { ...navItemStyle, ...activeStyle } : navItemStyle}>
                        <FiTarget style={{ marginRight: '0.75rem' }} /> Budgets
                    </NavLink>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        </div>
                    </div>

                    <button onClick={toggleTheme} style={{ ...navItemStyle, justifyContent: 'flex-start' }}>
                        {theme === 'light' ? <><FiMoon style={{ marginRight: '0.75rem' }} /> Dark Mode</> : <><FiSun style={{ marginRight: '0.75rem' }} /> Light Mode</>}
                    </button>
                    
                    <button onClick={handleLogout} style={{ ...navItemStyle, justifyContent: 'flex-start', color: 'var(--color-danger)' }}>
                        <FiLogOut style={{ marginRight: '0.75rem' }} /> Logout
                    </button>
                </div>
            </div>

            <div style={mainContentStyle}>
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
