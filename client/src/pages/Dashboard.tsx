import React from "react";
import { useQuery } from "react-query";
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Star,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  transactionsAPI,
  productsAPI,
  feedbackAPI,
  usersAPI,
} from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dailySales, isLoading: salesLoading } = useQuery(
    "daily-sales",
    () => transactionsAPI.getDailySales(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const { data: monthlySales } = useQuery(
    "monthly-sales",
    () => transactionsAPI.getMonthlySales(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const { data: lowStockProducts } = useQuery(
    "low-stock-dashboard",
    () => productsAPI.getLowStock(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const { data: feedbackAnalytics } = useQuery(
    "feedback-dashboard",
    () => feedbackAPI.getAnalytics(),
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const { data: usersData } = useQuery(
    "users-count",
    () => usersAPI.getAll({ per_page: 1 }),
    {
      enabled: user?.role?.name === "admin",
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Safe data extraction with defaults
  const todaySales = {
    total_sales: dailySales?.data?.total_sales || 0,
    total_transactions: dailySales?.data?.total_transactions || 0,
    total_profit: dailySales?.data?.total_profit || 0,
  };

  const monthlyData = {
    total_sales: monthlySales?.data?.total_sales || 0,
    total_profit: monthlySales?.data?.total_profit || 0,
    profit_margin: monthlySales?.data?.profit_margin || 0,
  };

  const lowStock = lowStockProducts?.data?.products || [];

  // Safe feedback data with proper defaults
  const feedback = {
    total_feedback: feedbackAnalytics?.data?.total_feedback || 0,
    average_rating: feedbackAnalytics?.data?.average_rating || 0,
    rating_distribution: feedbackAnalytics?.data?.rating_distribution || {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };

  const totalUsers = usersData?.data?.total || 0;

  // Calculate satisfaction metrics safely
  const positiveReviews =
    (feedback.rating_distribution[4] || 0) +
    (feedback.rating_distribution[5] || 0);
  const negativeReviews =
    (feedback.rating_distribution[1] || 0) +
    (feedback.rating_distribution[2] || 0);
  const satisfactionRate =
    feedback.total_feedback > 0
      ? (positiveReviews / feedback.total_feedback) * 100
      : 0;

  // Show loading state while any critical data is loading
  if (salesLoading) {
    return (
      <div className="dashboard fade-in">
        <div className="text-center p-4" style={{ marginTop: "2rem" }}>
          <LoadingSpinner size="lg" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      {/* Welcome Header */}
      <div className="page-header mb-4">
        <div>
          <h1>Welcome back, {user?.first_name}! 👋</h1>
          <p className="text-muted">
            Here's what's happening with your beauty store today
          </p>
        </div>
        <div className="flex" style={{ alignItems: "center", gap: "1rem" }}>
          <div
            className="date-display"
            style={{
              background: "var(--primary-color)",
              color: "white",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Calendar size={16} />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div
        className="metrics-grid mb-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Today's Sales */}
        <div className="card">
          <div className="card-body">
            <div className="flex-between">
              <div>
                <p className="text-muted mb-2">Today's Sales</p>
                <h2 style={{ color: "var(--success-color)", margin: 0 }}>
                  ₱{todaySales.total_sales.toFixed(2)}
                </h2>
                <small className="text-muted">
                  {todaySales.total_transactions} transactions
                </small>
              </div>
              <div
                style={{
                  background: "rgba(76, 175, 80, 0.1)",
                  padding: "1rem",
                  borderRadius: "50%",
                }}
              >
                <DollarSign size={28} color="var(--success-color)" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="card">
          <div className="card-body">
            <div className="flex-between">
              <div>
                <p className="text-muted mb-2">Today's Profit</p>
                <h2
                  style={{
                    color:
                      todaySales.total_profit >= 0
                        ? "var(--success-color)"
                        : "var(--error-color)",
                    margin: 0,
                  }}
                >
                  ₱{todaySales.total_profit.toFixed(2)}
                </h2>
                <small
                  style={{
                    color:
                      monthlyData.profit_margin >= 0
                        ? "var(--success-color)"
                        : "var(--error-color)",
                  }}
                >
                  {monthlyData.profit_margin.toFixed(1)}% margin this month
                </small>
              </div>
              <div
                style={{
                  background:
                    todaySales.total_profit >= 0
                      ? "rgba(76, 175, 80, 0.1)"
                      : "rgba(244, 67, 54, 0.1)",
                  padding: "1rem",
                  borderRadius: "50%",
                }}
              >
                <TrendingUp
                  size={28}
                  color={
                    todaySales.total_profit >= 0
                      ? "var(--success-color)"
                      : "var(--error-color)"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-body">
            <div className="flex-between">
              <div>
                <p className="text-muted mb-2">Low Stock Items</p>
                <h2
                  style={{
                    color:
                      lowStock.length > 0
                        ? "var(--warning-color)"
                        : "var(--success-color)",
                    margin: 0,
                  }}
                >
                  {lowStock.length}
                </h2>
                <small className="text-muted">
                  {lowStock.length > 0 ? "Need attention" : "All good!"}
                </small>
              </div>
              <div
                style={{
                  background:
                    lowStock.length > 0
                      ? "rgba(255, 152, 0, 0.1)"
                      : "rgba(76, 175, 80, 0.1)",
                  padding: "1rem",
                  borderRadius: "50%",
                }}
              >
                {lowStock.length > 0 ? (
                  <AlertTriangle size={28} color="var(--warning-color)" />
                ) : (
                  <Package size={28} color="var(--success-color)" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="card">
          <div className="card-body">
            <div className="flex-between">
              <div>
                <p className="text-muted mb-2">Customer Rating</p>
                <h2 style={{ color: "var(--warning-color)", margin: 0 }}>
                  {feedback.average_rating.toFixed(1)}/5
                </h2>
                <small className="text-muted">
                  {satisfactionRate.toFixed(0)}% satisfaction rate
                </small>
              </div>
              <div
                style={{
                  background: "rgba(255, 193, 7, 0.1)",
                  padding: "1rem",
                  borderRadius: "50%",
                }}
              >
                <Star size={28} color="var(--warning-color)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid-2 mb-4">
        {/* Customer Feedback Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Customer Feedback Analysis</h3>
            <span className="badge badge-info">
              {feedback.total_feedback} total reviews
            </span>
          </div>
          <div className="card-body">
            {feedback.total_feedback === 0 ? (
              <div className="text-center p-4">
                <Star size={48} color="#ccc" />
                <h4 style={{ color: "#999", margin: "1rem 0 0.5rem 0" }}>
                  No Reviews Yet
                </h4>
                <p className="text-muted">
                  Customer feedback will appear here once you receive reviews.
                </p>
              </div>
            ) : (
              <>
                <div className="feedback-stats mb-4">
                  <div
                    className="grid-3"
                    style={{ gap: "1rem", marginBottom: "1.5rem" }}
                  >
                    <div className="text-center">
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "var(--success-color)",
                        }}
                      >
                        {positiveReviews}
                      </div>
                      <small className="text-muted">Positive (4-5★)</small>
                    </div>
                    <div className="text-center">
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "var(--warning-color)",
                        }}
                      >
                        {feedback.rating_distribution[3] || 0}
                      </div>
                      <small className="text-muted">Neutral (3★)</small>
                    </div>
                    <div className="text-center">
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "var(--error-color)",
                        }}
                      >
                        {negativeReviews}
                      </div>
                      <small className="text-muted">Negative (1-2★)</small>
                    </div>
                  </div>
                </div>

                <div className="rating-breakdown">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = feedback.rating_distribution[rating] || 0;
                    const percentage =
                      feedback.total_feedback > 0
                        ? (count / feedback.total_feedback) * 100
                        : 0;

                    return (
                      <div key={rating} className="mb-3">
                        <div className="flex-between mb-1">
                          <div
                            className="flex"
                            style={{ alignItems: "center", gap: "0.5rem" }}
                          >
                            <span>{rating}</span>
                            <Star size={14} color="var(--warning-color)" />
                          </div>
                          <span>
                            {count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div
                          style={{
                            background: "#f0f0f0",
                            borderRadius: "4px",
                            height: "6px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              background:
                                rating >= 4
                                  ? "var(--success-color)"
                                  : rating === 3
                                  ? "var(--warning-color)"
                                  : "var(--error-color)",
                              width: `${percentage}%`,
                              height: "100%",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feedback Insights */}
                <div
                  className="feedback-insights mt-4 p-3"
                  style={{
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <h5 style={{ margin: "0 0 0.5rem 0" }}>📊 Insights</h5>
                  {satisfactionRate >= 80 ? (
                    <p style={{ margin: 0, color: "var(--success-color)" }}>
                      Excellent! {satisfactionRate.toFixed(0)}% of customers are
                      satisfied with your service.
                    </p>
                  ) : satisfactionRate >= 60 ? (
                    <p style={{ margin: 0, color: "var(--warning-color)" }}>
                      Good progress! {satisfactionRate.toFixed(0)}% satisfaction
                      rate. Consider addressing common concerns.
                    </p>
                  ) : (
                    <p style={{ margin: 0, color: "var(--error-color)" }}>
                      Needs attention! Only {satisfactionRate.toFixed(0)}%
                      satisfaction rate. Focus on service improvements.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Inventory Status */}
        <div className="card">
          <div className="card-header">
            <h3>Inventory Status</h3>
            <span
              className={`badge ${
                lowStock.length > 0 ? "badge-warning" : "badge-success"
              }`}
            >
              {lowStock.length > 0
                ? `${lowStock.length} items low`
                : "All stocked"}
            </span>
          </div>
          <div className="card-body">
            {lowStock.length === 0 ? (
              <div className="text-center p-4">
                <Package size={48} color="var(--success-color)" />
                <h4
                  style={{
                    color: "var(--success-color)",
                    margin: "1rem 0 0.5rem 0",
                  }}
                >
                  All Good! 🎉
                </h4>
                <p className="text-muted">All products are well stocked.</p>
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <h5 style={{ color: "var(--warning-color)" }}>
                    ⚠️ Items Need Restocking
                  </h5>
                </div>
                {lowStock.slice(0, 5).map((product: any) => (
                  <div
                    key={product.id}
                    className="flex-between mb-3 p-3"
                    style={{
                      background: "rgba(255, 152, 0, 0.1)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 152, 0, 0.2)",
                    }}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <br />
                      <small className="text-muted">
                        SKU: {product.sku} | Category: {product.category?.name}
                      </small>
                    </div>
                    <div className="text-right">
                      <div
                        style={{
                          color: "var(--warning-color)",
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                        }}
                      >
                        {product.stock_quantity}
                      </div>
                      <small className="text-muted">
                        Min: {product.min_stock_level}
                      </small>
                    </div>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      +{lowStock.length - 5} more items need attention
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & System Stats */}
      <div className="grid-2 mb-4">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ gap: "1rem" }}>
              <button
                className="btn btn-primary"
                onClick={() => (window.location.href = "/pos")}
                style={{ padding: "1rem", height: "auto" }}
              >
                <ShoppingCart size={20} />
                <br />
                Start Sale
              </button>
              <button
                className="btn btn-outline"
                onClick={() => (window.location.href = "/products")}
                style={{ padding: "1rem", height: "auto" }}
              >
                <Package size={20} />
                <br />
                Manage Products
              </button>
              <button
                className="btn btn-outline"
                onClick={() => (window.location.href = "/reports")}
                style={{ padding: "1rem", height: "auto" }}
              >
                <BarChart3 size={20} />
                <br />
                View Reports
              </button>
              <button
                className="btn btn-outline"
                onClick={() => (window.location.href = "/transactions")}
                style={{ padding: "1rem", height: "auto" }}
              >
                <DollarSign size={20} />
                <br />
                Transactions
              </button>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="card">
          <div className="card-header">
            <h3>System Overview</h3>
          </div>
          <div className="card-body">
            <div className="system-stats">
              <div className="flex-between mb-3">
                <span>Monthly Sales</span>
                <strong style={{ color: "var(--success-color)" }}>
                  ₱{monthlyData.total_sales.toFixed(2)}
                </strong>
              </div>
              <div className="flex-between mb-3">
                <span>Monthly Profit</span>
                <strong
                  style={{
                    color:
                      monthlyData.total_profit >= 0
                        ? "var(--success-color)"
                        : "var(--error-color)",
                  }}
                >
                  ₱{monthlyData.total_profit.toFixed(2)}
                </strong>
              </div>
              {user?.role?.name === "admin" && (
                <div className="flex-between mb-3">
                  <span>Total Users</span>
                  <strong>{totalUsers}</strong>
                </div>
              )}
              <div className="flex-between mb-3">
                <span>Customer Reviews</span>
                <strong>{feedback.total_feedback}</strong>
              </div>
              <div className="flex-between">
                <span>System Status</span>
                <span className="badge badge-success">Online</span>
              </div>
            </div>

            {/* Performance Indicator */}
            <div
              className="performance-indicator mt-4 p-3"
              style={{
                background:
                  monthlyData.profit_margin >= 15
                    ? "rgba(76, 175, 80, 0.1)"
                    : monthlyData.profit_margin >= 5
                    ? "rgba(255, 152, 0, 0.1)"
                    : "rgba(244, 67, 54, 0.1)",
                borderRadius: "8px",
                border: `1px solid ${
                  monthlyData.profit_margin >= 15
                    ? "var(--success-color)"
                    : monthlyData.profit_margin >= 5
                    ? "var(--warning-color)"
                    : "var(--error-color)"
                }`,
              }}
            >
              <div className="text-center">
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color:
                      monthlyData.profit_margin >= 15
                        ? "var(--success-color)"
                        : monthlyData.profit_margin >= 5
                        ? "var(--warning-color)"
                        : "var(--error-color)",
                  }}
                >
                  {monthlyData.profit_margin >= 15
                    ? "🚀 Excellent"
                    : monthlyData.profit_margin >= 5
                    ? "📈 Good"
                    : "⚠️ Needs Attention"}
                </div>
                <small className="text-muted">
                  Business Performance This Month
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="card">
        <div className="card-header">
          <h3>Today's Summary</h3>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ gap: "2rem" }}>
            <div className="text-center">
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "var(--primary-color)",
                }}
              >
                {todaySales.total_transactions}
              </div>
              <small className="text-muted">Transactions Today</small>
            </div>
            <div className="text-center">
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "var(--success-color)",
                }}
              >
                ₱{todaySales.total_sales.toFixed(0)}
              </div>
              <small className="text-muted">Revenue Today</small>
            </div>
            <div className="text-center">
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "var(--warning-color)",
                }}
              >
                {feedback.average_rating.toFixed(1)}★
              </div>
              <small className="text-muted">Average Rating</small>
            </div>
            <div className="text-center">
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color:
                    lowStock.length > 0
                      ? "var(--warning-color)"
                      : "var(--success-color)",
                }}
              >
                {lowStock.length}
              </div>
              <small className="text-muted">Low Stock Items</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
