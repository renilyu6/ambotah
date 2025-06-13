import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <h1>Welcome, {user?.first_name}!</h1>
        <p>Role: {user?.role?.display_name}</p>
      </div>
    </header>
  );
};

export default Header;
