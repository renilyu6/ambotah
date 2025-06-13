import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";
import TransactionsPage from "./pages/TransactionsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import POSPage from "./pages/POSPage";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import RoleBasedRoute from "./components/RoleBasedRoute";

// Access Denied Component
const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
      <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      <button onClick={() => window.history.back()} className="btn btn-primary">
        Go Back
      </button>
    </div>
  </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Role-based default route
  const getDefaultRoute = () => {
    switch (user.role?.name) {
      case "admin":
        return "/";
      case "manager":
        return "/reports";
      case "cashier":
        return "/pos";
      default:
        return "/pos";
    }
  };

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <Routes>
          {/* Dashboard - Admin only */}
          <Route
            path="/"
            element={
              <RoleBasedRoute
                allowedRoles={["admin"]}
                fallback={<Navigate to={getDefaultRoute()} replace />}
              >
                <Dashboard />
              </RoleBasedRoute>
            }
          />

          {/* POS - All roles */}
          <Route path="/pos" element={<POSPage />} />

          {/* Users - Admin only */}
          <Route
            path="/users"
            element={
              <RoleBasedRoute
                allowedRoles={["admin"]}
                fallback={<AccessDenied />}
              >
                <UsersPage />
              </RoleBasedRoute>
            }
          />

          {/* Roles - Admin only */}
          <Route
            path="/roles"
            element={
              <RoleBasedRoute
                allowedRoles={["admin"]}
                fallback={<AccessDenied />}
              >
                <RolesPage />
              </RoleBasedRoute>
            }
          />

          {/* Products - Admin, Manager */}
          <Route
            path="/products"
            element={
              <RoleBasedRoute
                allowedRoles={["admin", "manager"]}
                fallback={<AccessDenied />}
              >
                <ProductsPage />
              </RoleBasedRoute>
            }
          />

          {/* Categories - Admin, Manager */}
          <Route
            path="/categories"
            element={
              <RoleBasedRoute
                allowedRoles={["admin", "manager"]}
                fallback={<AccessDenied />}
              >
                <CategoriesPage />
              </RoleBasedRoute>
            }
          />

          {/* Transactions - Admin, Manager only (removed cashier) */}
          <Route
            path="/transactions"
            element={
              <RoleBasedRoute
                allowedRoles={["admin", "manager"]}
                fallback={<AccessDenied />}
              >
                <TransactionsPage />
              </RoleBasedRoute>
            }
          />

          {/* Reports - Admin, Manager */}
          <Route
            path="/reports"
            element={
              <RoleBasedRoute
                allowedRoles={["admin", "manager"]}
                fallback={<AccessDenied />}
              >
                <ReportsPage />
              </RoleBasedRoute>
            }
          />

          {/* Settings - Admin only (full access), Manager (limited access) */}
          <Route
            path="/settings"
            element={
              <RoleBasedRoute
                allowedRoles={["admin", "manager"]}
                fallback={<AccessDenied />}
              >
                <SettingsPage />
              </RoleBasedRoute>
            }
          />

          {/* Redirect based on role */}
          <Route
            path="*"
            element={<Navigate to={getDefaultRoute()} replace />}
          />
        </Routes>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

export default App;
