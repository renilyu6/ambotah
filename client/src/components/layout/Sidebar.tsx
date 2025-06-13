import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Shield,
  Tags,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/",
      roles: ["admin", "manager", "cashier"],
    },
    {
      icon: ShoppingCart,
      label: "POS",
      path: "/pos",
      roles: ["admin", "manager", "cashier"],
    },
    {
      icon: Package,
      label: "Products",
      path: "/products",
      roles: ["admin", "manager"],
    },
    {
      icon: Tags,
      label: "Categories",
      path: "/categories",
      roles: ["admin", "manager"],
    },
    {
      icon: Receipt,
      label: "Transactions",
      path: "/transactions",
      roles: ["admin", "manager", "cashier"],
    },
    {
      icon: BarChart3,
      label: "Reports",
      path: "/reports",
      roles: ["admin", "manager"],
    },
    { icon: Users, label: "Users", path: "/users", roles: ["admin"] },
    { icon: Shield, label: "Roles", path: "/roles", roles: ["admin"] },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      roles: ["admin", "manager"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    const userRole = user?.role?.name || "";
    return item.roles.includes(userRole);
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ChicCheckout</h2>
        <p>Beauty POS</p>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p>
            {user?.first_name} {user?.last_name}
          </p>
          <small>{user?.role?.display_name || user?.role?.name}</small>
        </div>
        <button onClick={logout} className="logout-btn">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
