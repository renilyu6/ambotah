import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Search, Eye, Receipt, Calendar, Filter } from "lucide-react";
import { transactionsAPI, productsAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ReceiptPrinter from "../components/ReceiptPrinter";
import POSModal from "../components/POSModal";
import toast from "react-hot-toast";

interface Transaction {
  id: number;
  transaction_number: string;
  customer_name: string;
  customer_email: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  status: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  items: TransactionItem[];
  created_at: string;
}

interface TransactionItem {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Helper function to ensure numeric values
const ensureNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
};

// Helper function to normalize transaction data
const normalizeTransaction = (transaction: any): Transaction => ({
  ...transaction,
  subtotal: ensureNumber(transaction.subtotal),
  discount_amount: ensureNumber(transaction.discount_amount),
  tax_amount: ensureNumber(transaction.tax_amount),
  total_amount: ensureNumber(transaction.total_amount),
  amount_paid: ensureNumber(transaction.amount_paid),
  change_amount: ensureNumber(transaction.change_amount),
  items:
    transaction.items?.map((item: any) => ({
      ...item,
      quantity: ensureNumber(item.quantity),
      unit_price: ensureNumber(item.unit_price),
      total_price: ensureNumber(item.total_price),
    })) || [],
});

const TransactionsPage: React.FC = () => {
  const [showPOSModal, setShowPOSModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery(
    ["transactions", searchTerm, dateFrom, dateTo, statusFilter],
    () =>
      transactionsAPI.getAll({
        search: searchTerm,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: statusFilter || undefined,
      }),
    { keepPreviousData: true }
  );

  // Normalize the transactions data
  const transactions: Transaction[] = (transactionsData?.data?.data || []).map(
    normalizeTransaction
  );

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const handleNewTransaction = () => {
    setShowPOSModal(true);
  };

  const handleTransactionComplete = () => {
    queryClient.invalidateQueries("transactions");
    setShowPOSModal(false);
    toast.success("Transaction completed successfully!");
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: "badge-success",
      pending: "badge-warning",
      cancelled: "badge-danger",
    };
    return (
      statusClasses[status as keyof typeof statusClasses] || "badge-secondary"
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return "💵";
      case "card":
        return "💳";
      case "digital_wallet":
        return "📱";
      default:
        return "💰";
    }
  };

  return (
    <div className="transactions-page fade-in">
      {/* Header */}
      <div className="page-header flex-between mb-4">
        <div>
          <h1>Transactions</h1>
          <p className="text-muted">View and manage sales transactions</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewTransaction}>
          <Plus size={16} />
          New Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section mb-4">
        <div className="card">
          <div className="card-body">
            <div className="grid-4">
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#666",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="form-input"
                placeholder="From Date"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="form-input"
                placeholder="To Date"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3>Transactions ({transactions.length})</h3>
        </div>
        <div className="card-body p-0">
          {transactionsLoading ? (
            <div className="text-center p-4">
              <LoadingSpinner />
              <p className="mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No transactions found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction #</th>
                    <th>Customer</th>
                    <th>Cashier</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.transaction_number}</strong>
                      </td>
                      <td>
                        {transaction.customer_name || "Walk-in Customer"}
                        {transaction.customer_email && (
                          <>
                            <br />
                            <small className="text-muted">
                              {transaction.customer_email}
                            </small>
                          </>
                        )}
                      </td>
                      <td>
                        {transaction.user.first_name}{" "}
                        {transaction.user.last_name}
                      </td>
                      <td>
                        <div>
                          {transaction.items.length} item(s)
                          <br />
                          <small className="text-muted">
                            {transaction.items
                              .slice(0, 2)
                              .map((item) => item.product.name)
                              .join(", ")}
                            {transaction.items.length > 2 && "..."}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>
                            ₱{transaction.total_amount.toFixed(2)}
                          </strong>
                          {transaction.discount_amount > 0 && (
                            <>
                              <br />
                              <small className="text-success">
                                -₱{transaction.discount_amount.toFixed(2)}
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className="flex"
                          style={{ alignItems: "center", gap: "0.5rem" }}
                        >
                          <span>
                            {getPaymentMethodIcon(transaction.payment_method)}
                          </span>
                          <span style={{ textTransform: "capitalize" }}>
                            {transaction.payment_method.replace("_", " ")}
                          </span>
                        </div>
                        <small className="text-muted">
                          Paid: ₱{transaction.amount_paid.toFixed(2)}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td>
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <br />
                        <small className="text-muted">
                          {new Date(
                            transaction.created_at
                          ).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        <div className="flex" style={{ gap: "0.5rem" }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleViewReceipt(transaction)}
                            title="View Receipt"
                          >
                            <Receipt size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* POS Modal */}
      {showPOSModal && (
        <POSModal
          onClose={() => setShowPOSModal(false)}
          onTransactionComplete={handleTransactionComplete}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <ReceiptPrinter
          transaction={selectedTransaction}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
