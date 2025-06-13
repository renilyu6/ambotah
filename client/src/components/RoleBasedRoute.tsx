import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface RoleBasedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role?.name)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
