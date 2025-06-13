import { useAuth } from '../contexts/AuthContext';

export const useRoleAccess = () => {
  const { user, hasRole } = useAuth();

  const canAccess = (allowedRoles: string | string[]): boolean => {
    return hasRole(allowedRoles);
  };

  const canAccessDashboard = (): boolean => {
    return hasRole('admin');
  };

  const canAccessPOS = (): boolean => {
    return hasRole(['admin', 'manager', 'cashier']);
  };

  const canAccessReports = (): boolean => {
    return hasRole(['admin', 'manager']);
  };

  const canAccessProducts = (): boolean => {
    return hasRole(['admin', 'manager']);
  };

  const canAccessUsers = (): boolean => {
    return hasRole('admin');
  };

  const canAccessSettings = (): boolean => {
    return hasRole(['admin', 'manager']);
  };

  const canAccessFullSettings = (): boolean => {
    return hasRole('admin');
  };

  const canAccessTransactions = (): boolean => {
    return hasRole(['admin', 'manager']); // Removed cashier
  };

  const canCreateTransactions = (): boolean => {
    return hasRole(['admin', 'manager', 'cashier']); // Cashiers can still create transactions via POS
  };

  const getDefaultRoute = (): string => {
    const role = user?.role?.name;
    switch (role) {
      case 'admin':
        return '/';
      case 'manager':
        return '/reports';
      case 'cashier':
        return '/pos';
      default:
        return '/pos';
    }
  };

  return {
    user,
    canAccess,
    canAccessDashboard,
    canAccessPOS,
    canAccessReports,
    canAccessProducts,
    canAccessUsers,
    canAccessSettings,
    canAccessFullSettings,
    canAccessTransactions,
    canCreateTransactions,
    getDefaultRoute,
  };
};