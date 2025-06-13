import React, { useState } from "react";
import { useQuery } from "react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { transactionsAPI, productsAPI, feedbackAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";

interface SalesData {
  total_sales: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  total_transactions: number;
  average_order_value: number;
}

interface ProductSales {
  product_name: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
}

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState("today");
  const [reportType, setReportType] = useState("overview");

  // Fetch sales data
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery(
    ["sales-report", dateRange],
    () => transactionsAPI.getMonthlySales(),
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error("Error fetching sales data:", error);
      },
    }
  );

  // Fetch daily sales
  const { data: dailySalesData } = useQuery(
    ["daily-sales", dateRange],
    () => transactionsAPI.getDailySales(),
    { keepPreviousData: true }
  );

  // Fetch low stock products
  const { data: lowStockData } = useQuery("low-stock", () =>
    productsAPI.getLowStock()
  );

  // Fetch feedback analytics
  const { data: feedbackData, error: feedbackError } = useQuery(
    "feedback-analytics",
    () => feedbackAPI.getAnalytics(),
    {
      onError: (error) => {
        console.error("Error fetching feedback data:", error);
      },
    }
  );

  console.log("Sales Data:", salesData);
  console.log("Feedback Data:", feedbackData);

  const sales: SalesData = {
    total_sales: salesData?.data?.total_sales ?? 0,
    total_cost: salesData?.data?.total_cost ?? 0,
    total_profit: salesData?.data?.total_profit ?? 0,
    profit_margin: salesData?.data?.profit_margin ?? 0,
    total_transactions: salesData?.data?.total_transactions ?? 0,
    average_order_value: salesData?.data?.average_order_value ?? 0,
  };

  const feedback = feedbackData?.data?.analytics || {
    total_feedback: 0,
    average_rating: 0,
    five_star: 0,
    four_star: 0,
    three_star: 0,
    two_star: 0,
    one_star: 0,
  };

  const lowStockProducts = lowStockData?.data?.products || [];

  const exportReport = () => {
    // Create CSV content
    const csvContent = `
Sales Report - ${new Date().toLocaleDateString()}

Summary:
Total Sales,₱${sales.total_sales.toFixed(2)}
Total Cost,₱${sales.total_cost.toFixed(2)}
Total Profit,₱${sales.total_profit.toFixed(2)}
Profit Margin,${sales.profit_margin.toFixed(2)}%
Total Transactions,${sales.total_transactions}
Average Order Value,₱${sales.average_order_value.toFixed(2)}

Customer Feedback:
Total Reviews,${feedback.total_feedback}
Average Rating,${feedback.average_rating.toFixed(1)}/5
5 Stars,${feedback.rating_distribution[5]}
4 Stars,${feedback.rating_distribution[4]}
3 Stars,${feedback.rating_distribution[3]}
2 Stars,${feedback.rating_distribution[2]}
1 Star,${feedback.rating_distribution[1]}
    `.trim();

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page fade-in">
      {/* Header */}
      <div className="page-header flex-between mb-4">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportReport}>
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-select"
              >
                <option value="overview">Overview</option>
                <option value="sales">Sales Analysis</option>
                <option value="products">Product Performance</option>
                <option value="feedback">Customer Feedback</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {salesLoading ? (
        <div className="text-center p-4">
          <LoadingSpinner size="lg" />
          <p className="mt-2">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div
            className="metrics-grid mb-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="card">
              <div className="card-body">
                <div className="flex-between">
                  <div>
                    <p className="text-muted mb-2">Total Sales</p>
                    <h3 style={{ color: "var(--success-color)" }}>
                      ₱{sales.total_sales.toFixed(2)}
                    </h3>
                  </div>
                  <div
                    style={{
                      background: "rgba(76, 175, 80, 0.1)",
                      padding: "0.75rem",
                      borderRadius: "50%",
                    }}
                  >
                    <DollarSign size={24} color="var(--success-color)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex-between">
                  <div>
                    <p className="text-muted mb-2">Total Profit</p>
                    <h3
                      style={{
                        color:
                          sales.total_profit >= 0
                            ? "var(--success-color)"
                            : "var(--error-color)",
                      }}
                    >
                      ₱{sales.total_profit.toFixed(2)}
                    </h3>
                    <small
                      style={{
                        color:
                          sales.profit_margin >= 0
                            ? "var(--success-color)"
                            : "var(--error-color)",
                      }}
                    >
                      {sales.profit_margin >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {sales.profit_margin.toFixed(1)}% margin
                    </small>
                  </div>
                  <div
                    style={{
                      background:
                        sales.total_profit >= 0
                          ? "rgba(76, 175, 80, 0.1)"
                          : "rgba(244, 67, 54, 0.1)",
                      padding: "0.75rem",
                      borderRadius: "50%",
                    }}
                  >
                    {sales.total_profit >= 0 ? (
                      <TrendingUp
                        size={24}
                        color={
                          sales.total_profit >= 0
                            ? "var(--success-color)"
                            : "var(--error-color)"
                        }
                      />
                    ) : (
                      <TrendingDown
                        size={24}
                        color={
                          sales.total_profit >= 0
                            ? "var(--success-color)"
                            : "var(--error-color)"
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex-between">
                  <div>
                    <p className="text-muted mb-2">Total Transactions</p>
                    <h3>{sales.total_transactions}</h3>
                    <small className="text-muted">
                      Avg: ₱{sales.average_order_value.toFixed(2)}
                    </small>
                  </div>
                  <div
                    style={{
                      background: "rgba(33, 150, 243, 0.1)",
                      padding: "0.75rem",
                      borderRadius: "50%",
                    }}
                  >
                    <BarChart3 size={24} color="var(--info-color)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex-between">
                  <div>
                    <p className="text-muted mb-2">Customer Rating</p>
                    <h3 style={{ color: "var(--warning-color)" }}>
                      {feedback.average_rating.toFixed(1)}/5
                    </h3>
                    <small className="text-muted">
                      {feedback.total_feedback} reviews
                    </small>
                  </div>
                  <div
                    style={{
                      background: "rgba(255, 152, 0, 0.1)",
                      padding: "0.75rem",
                      borderRadius: "50%",
                    }}
                  >
                    <Users size={24} color="var(--warning-color)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Feedback Analysis */}
          <div className="grid-2 mb-4">
            <div className="card">
              <div className="card-header">
                <h3>Customer Feedback Distribution</h3>
              </div>
              <div className="card-body">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count =
                    feedback[
                      `${
                        rating === 5
                          ? "five"
                          : rating === 4
                          ? "four"
                          : rating === 3
                          ? "three"
                          : rating === 2
                          ? "two"
                          : "one"
                      }_star`
                    ] || 0;
                  const percentage =
                    feedback.total_feedback > 0
                      ? (count / feedback.total_feedback) * 100
                      : 0;

                  return (
                    <div key={rating} className="mb-3">
                      <div className="flex-between mb-1">
                        <span>
                          {rating} Star{rating !== 1 ? "s" : ""}
                        </span>
                        <span>
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#f0f0f0",
                          borderRadius: "4px",
                          height: "8px",
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
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Low Stock Alert</h3>
              </div>
              <div className="card-body">
                {lowStockProducts.length === 0 ? (
                  <p className="text-muted">All products are well stocked!</p>
                ) : (
                  <div>
                    {lowStockProducts.slice(0, 5).map((product: any) => (
                      <div
                        key={product.id}
                        className="flex-between mb-2 p-2"
                        style={{
                          background: "rgba(255, 152, 0, 0.1)",
                          borderRadius: "4px",
                        }}
                      >
                        <div>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">{product.sku}</small>
                        </div>
                        <div className="text-right">
                          <span style={{ color: "var(--warning-color)" }}>
                            {product.stock_quantity} left
                          </span>
                          <br />
                          <small className="text-muted">
                            Min: {product.min_stock_level}
                          </small>
                        </div>
                      </div>
                    ))}
                    {lowStockProducts.length > 5 && (
                      <p className="text-muted text-center mt-2">
                        +{lowStockProducts.length - 5} more items need
                        restocking
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profit/Loss Analysis */}
          <div className="card mb-4">
            <div className="card-header">
              <h3>Profit & Loss Analysis</h3>
            </div>
            <div className="card-body">
              <div className="grid-2">
                <div>
                  <h4
                    style={{
                      color: "var(--success-color)",
                      marginBottom: "1rem",
                    }}
                  >
                    Revenue Breakdown
                  </h4>
                  <div className="mb-3">
                    <div className="flex-between mb-1">
                      <span>Gross Sales</span>
                      <strong>₱{sales.total_sales.toFixed(2)}</strong>
                    </div>
                    <div className="flex-between mb-1">
                      <span>Cost of Goods Sold</span>
                      <span style={{ color: "var(--error-color)" }}>
                        -₱{sales.total_cost.toFixed(2)}
                      </span>
                    </div>
                    <hr />
                    <div className="flex-between">
                      <strong>Net Profit</strong>
                      <strong
                        style={{
                          color:
                            sales.total_profit >= 0
                              ? "var(--success-color)"
                              : "var(--error-color)",
                        }}
                      >
                        ₱{sales.total_profit.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h4
                    style={{ color: "var(--info-color)", marginBottom: "1rem" }}
                  >
                    Performance Metrics
                  </h4>
                  <div className="mb-3">
                    <div className="flex-between mb-2">
                      <span>Profit Margin</span>
                      <span
                        className={`badge ${
                          sales.profit_margin >= 20
                            ? "badge-success"
                            : sales.profit_margin >= 10
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {sales.profit_margin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex-between mb-2">
                      <span>Average Order Value</span>
                      <strong>₱{sales.average_order_value.toFixed(2)}</strong>
                    </div>
                    <div className="flex-between mb-2">
                      <span>Customer Satisfaction</span>
                      <span
                        className={`badge ${
                          feedback.average_rating >= 4
                            ? "badge-success"
                            : feedback.average_rating >= 3
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {feedback.average_rating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Trend Indicator */}
              <div
                className="profit-indicator mt-4 p-3"
                style={{
                  background:
                    sales.total_profit >= 0
                      ? "rgba(76, 175, 80, 0.1)"
                      : "rgba(244, 67, 54, 0.1)",
                  borderRadius: "8px",
                  border: `1px solid ${
                    sales.total_profit >= 0
                      ? "var(--success-color)"
                      : "var(--error-color)"
                  }`,
                }}
              >
                <div
                  className="flex"
                  style={{ alignItems: "center", gap: "1rem" }}
                >
                  {sales.total_profit >= 0 ? (
                    <TrendingUp size={32} color="var(--success-color)" />
                  ) : (
                    <TrendingDown size={32} color="var(--error-color)" />
                  )}
                  <div>
                    <h4
                      style={{
                        color:
                          sales.total_profit >= 0
                            ? "var(--success-color)"
                            : "var(--error-color)",
                        margin: 0,
                      }}
                    >
                      {sales.total_profit >= 0
                        ? "Profitable Period"
                        : "Loss Period"}
                    </h4>
                    <p style={{ margin: 0, color: "var(--text-muted)" }}>
                      {sales.total_profit >= 0
                        ? "Your business is generating positive returns. Keep up the good work!"
                        : "Consider reviewing your pricing strategy and cost management."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="card-header">
              <h3>Business Insights & Recommendations</h3>
            </div>
            <div className="card-body">
              <div className="grid-2">
                <div>
                  <h5 style={{ color: "var(--primary-color)" }}>
                    📈 Growth Opportunities
                  </h5>
                  <ul style={{ paddingLeft: "1.5rem" }}>
                    {sales.profit_margin < 15 && (
                      <li>
                        Consider reviewing product pricing to improve profit
                        margins
                      </li>
                    )}
                    {sales.average_order_value < 500 && (
                      <li>
                        Implement upselling strategies to increase average order
                        value
                      </li>
                    )}
                    {feedback.average_rating < 4 && (
                      <li>
                        Focus on customer service improvements to boost
                        satisfaction
                      </li>
                    )}
                    {lowStockProducts.length > 0 && (
                      <li>
                        Restock {lowStockProducts.length} products to avoid lost
                        sales
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h5 style={{ color: "var(--success-color)" }}>
                    ✅ Strengths
                  </h5>
                  <ul style={{ paddingLeft: "1.5rem" }}>
                    {sales.profit_margin >= 15 && (
                      <li>
                        Healthy profit margins indicate good pricing strategy
                      </li>
                    )}
                    {feedback.average_rating >= 4 && (
                      <li>High customer satisfaction scores</li>
                    )}
                    {sales.total_transactions > 50 && (
                      <li>
                        Strong transaction volume indicates good customer base
                      </li>
                    )}
                    {lowStockProducts.length === 0 && (
                      <li>Well-managed inventory levels</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
