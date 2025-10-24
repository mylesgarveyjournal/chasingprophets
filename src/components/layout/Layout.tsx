import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart2, Database, Settings, Search, LogOut, Bell } from 'react-feather';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="logo" onClick={toggleSidebar}>
          <img src="/logo.svg" alt="ChasingProphets" />
          <span className="logo-text">ChasingProphets</span>
        </div>

        <nav className="nav-menu">
          <div className="nav-items">
            <Link 
              to="/dashboard" 
              className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              data-tooltip="Dashboard"
            >
              <div className="nav-icon"><BarChart2 size={24} /></div>
              <span className="nav-text">Dashboard</span>
            </Link>
            <Link 
              to="/assets" 
              className={`nav-item ${location.pathname === '/assets' ? 'active' : ''}`}
              data-tooltip="Assets"
            >
              <div className="nav-icon"><Database size={24} /></div>
              <span className="nav-text">Assets</span>
            </Link>
            <Link 
              to="/settings" 
              className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
              data-tooltip="Settings"
            >
              <div className="nav-icon"><Settings size={24} /></div>
              <span className="nav-text">Settings</span>
            </Link>
            <button 
              className="nav-item"
              onClick={handleLogout}
              data-tooltip="Log Out"
            >
              <div className="nav-icon"><LogOut size={24} /></div>
              <span className="nav-text">Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className={`main-container ${isCollapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="search-bar">
            <Search />
            <input type="text" placeholder="Search markets, prophets, analysis..." />
          </div>

          <div className="user-menu">
            <button className="icon-button bell-icon" title="Notifications">
              <Bell size={20} />
            </button>
            <div className="user-profile">
              <span className="username">{user?.username}</span>
            </div>
            <button className="icon-button" onClick={handleLogout} title="Log Out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;