import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  ShoppingCart,
  Users,
  Shield,
  Package,
  Tag,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const role = user?.role?.name;

    const allItems = [
      { path: "/", icon: Home, label: "Dashboard", roles: ["admin"] },
      {
        path: "/pos",
        icon: ShoppingCart,
        label: "POS",
        roles: ["admin", "manager", "cashier"],
      },
      {
        path: "/transactions",
        icon: Receipt,
        label: "Transactions",
        roles: ["admin", "manager"],
      },
      {
        path: "/reports",
        icon: BarChart3,
        label: "Reports",
        roles: ["admin", "manager"],
      },
      {
        path: "/products",
        icon: Package,
        label: "Products",
        roles: ["admin", "manager"],
      },
      {
        path: "/categories",
        icon: Tag,
        label: "Categories",
        roles: ["admin", "manager"],
      },
      { path: "/users", icon: Users, label: "Users", roles: ["admin"] },
      { path: "/roles", icon: Shield, label: "Roles", roles: ["admin"] },
      {
        path: "/settings",
        icon: Settings,
        label: "Settings",
        roles: ["admin", "manager"],
      },
    ];

    return allItems.filter((item) => item.roles.includes(role || ""));
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>ChicCheckout POS</h2>
          <div className="user-info">
            <p className="user-name">
              {user?.first_name} {user?.last_name}
            </p>
            <span className={`role-badge role-${user?.role?.name}`}>
              {user?.role?.display_name}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">{children}</main>

      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 250px;
          background: var(--card-bg);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h2 {
          margin: 0 0 1rem 0;
          color: var(--primary-color);
        }

        .user-info .user-name {
          margin: 0;
          font-weight: 600;
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-admin {
          background: rgba(220, 38, 127, 0.1);
          color: #dc267f;
        }

        .role-manager {
          background: rgba(255, 152, 0, 0.1);
          color: #ff9800;
        }

        .role-cashier {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          color: var(--text-color);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary-color);
        }

        .nav-item.active {
          background: var(--primary-color);
          color: white;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          background: none;
          border: none;
          color: var(--error-color);
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(244, 67, 54, 0.1);
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          background: var(--bg-color);
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 200px;
          }
          
          .main-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
