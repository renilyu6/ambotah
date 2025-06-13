import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Receipt,
  Package,
  Percent,
} from "lucide-react";
import { productsAPI, discountsAPI, transactionsAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ReceiptPrinter from "../components/ReceiptPrinter";
import FeedbackForm from "../components/FeedbackForm";
import toast from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock_quantity: number;
  category: {
    name: string;
  };
  image_url?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Discount {
  id: number;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minimum_amount?: number;
}

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
  user: {
    first_name: string;
    last_name: string;
  };
  items: any[];
  created_at: string;
}

const POSPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null
  );
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "digital_wallet"
  >("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedTransaction, setCompletedTransaction] =
    useState<Transaction | null>(null);

  const queryClient = useQueryClient();

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery(
    ["products", searchTerm],
    () =>
      productsAPI.getAll({
        search: searchTerm || undefined,
        active_only: true,
      }),
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error("Error fetching products:", error);
      },
    }
  );

  // Fetch active discounts
  const {
    data: discountsData,
    isLoading: discountsLoading,
    error: discountsError,
  } = useQuery("active-discounts", () => discountsAPI.getActive(), {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error("Error fetching discounts:", error);
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation(transactionsAPI.create, {
    onSuccess: (response) => {
      const transaction = response.data.transaction;
      setCompletedTransaction(transaction);
      setShowCheckout(false);
      setShowReceipt(true);
      clearCart();
      toast.success("Transaction completed successfully!");
      queryClient.invalidateQueries("products");
    },
    onError: (error: any) => {
      console.log("Transaction error:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete transaction"
      );
    },
  });

  const products: Product[] = productsData?.data?.data || [];
  const discounts: Discount[] = discountsData?.data?.discounts || [];

  const displayProducts = React.useMemo(() => {
    return products.map((p) => {
      const cartItem = cart.find((item) => item.product.id === p.id);
      return {
        ...p,
        stock_quantity: p.stock_quantity - (cartItem?.quantity || 0),
      };
    });
  }, [products, cart]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  // Updated discount calculation with validation
  const discountAmount = selectedDiscount
    ? (() => {
        // Check minimum amount requirement
        if (
          selectedDiscount.minimum_amount &&
          subtotal < Number(selectedDiscount.minimum_amount)
        ) {
          return 0;
        }

        if (selectedDiscount.type === "percentage") {
          return (subtotal * Number(selectedDiscount.value)) / 100;
        } else {
          return Number(selectedDiscount.value);
        }
      })()
    : 0;

  // Check if discount minimum requirement is met
  const isDiscountValid = selectedDiscount
    ? !selectedDiscount.minimum_amount ||
      subtotal >= Number(selectedDiscount.minimum_amount)
    : true;

  const taxRate = 0.08; // 8% tax
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * taxRate;
  const totalAmount = taxableAmount + taxAmount;
  const changeAmount = Math.max(0, parseFloat(amountPaid || "0") - totalAmount);

  const addToCart = useCallback(
    (productId: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const cartItem = cart.find((item) => item.product.id === productId);
      const currentStock = product.stock_quantity - (cartItem?.quantity || 0);

      if (currentStock <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.product.id === productId
        );

        if (existingItem) {
          return prevCart.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total_price: (item.quantity + 1) * item.unit_price,
                }
              : item
          );
        } else {
          return [
            ...prevCart,
            {
              product,
              quantity: 1,
              unit_price: product.price,
              total_price: product.price,
            },
          ];
        }
      });
    },
    [products, cart]
  );

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.product.id === productId) {
            const originalProduct = products.find((p) => p.id === productId);
            if (
              originalProduct &&
              newQuantity > originalProduct.stock_quantity
            ) {
              toast.error("Not enough stock available");
              return item;
            }
            return {
              ...item,
              quantity: newQuantity,
              total_price: newQuantity * item.unit_price,
            };
          }
          return item;
        })
      );
    },
    [products]
  );

  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedDiscount(null);
    setCustomerName("");
    setCustomerEmail("");
    setAmountPaid("");
  }, []);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!isDiscountValid) {
      toast.error("Discount minimum amount not met");
      return;
    }

    if (
      paymentMethod === "cash" &&
      parseFloat(amountPaid || "0") < totalAmount
    ) {
      toast.error("Insufficient payment amount");
      return;
    }

    const transactionData = {
      customer_name: customerName,
      customer_email: customerEmail,
      payment_method: paymentMethod,
      amount_paid:
        paymentMethod === "cash" ? parseFloat(amountPaid) : totalAmount,
      discount_id: selectedDiscount?.id || null,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    createTransactionMutation.mutate(transactionData);
  }, [
    cart,
    customerName,
    customerEmail,
    paymentMethod,
    amountPaid,
    totalAmount,
    selectedDiscount,
    isDiscountValid,
    createTransactionMutation,
  ]);

  const handleReceiptClose = useCallback(() => {
    setShowReceipt(false);
    setShowFeedback(true);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    setShowFeedback(false);
    setCompletedTransaction(null);
  }, []);

  // Error boundary for the component
  if (productsError || discountsError) {
    return (
      <div className="pos-page fade-in">
        <div className="card">
          <div className="card-body text-center">
            <h3>Error Loading POS</h3>
            <p>
              There was an error loading the POS system. Please refresh the
              page.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-page fade-in">
      <div
        className="pos-container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "1rem",
          height: "calc(100vh - 100px)",
        }}
      >
        {/* Products Section */}
        <div className="products-section">
          <div
            className="card"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <div className="card-header">
              <h3>Products</h3>
              <div style={{ position: "relative", maxWidth: "300px" }}>
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>

            <div className="card-body" style={{ flex: 1, overflow: "auto" }}>
              {productsLoading ? (
                <div className="text-center p-4">
                  <LoadingSpinner />
                  <p className="mt-2">Loading products...</p>
                </div>
              ) : (
                <div
                  className="products-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {displayProducts.map((product) => (
                    <div
                      key={product.id}
                      className="product-card"
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "1rem",
                        cursor:
                          product.stock_quantity <= 0
                            ? "not-allowed"
                            : "pointer",
                        transition: "all 0.2s",
                        opacity: product.stock_quantity <= 0 ? 0.5 : 1,
                      }}
                      onClick={() =>
                        product.stock_quantity > 0 && addToCart(product.id)
                      }
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            marginBottom: "0.5rem",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "120px",
                            background: "#f0f0f0",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <Package size={40} color="#999" />
                        </div>
                      )}

                      <h4 style={{ fontSize: "14px", margin: "0 0 0.25rem 0" }}>
                        {product.name}
                      </h4>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        {product.category.name}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <strong style={{ color: "var(--primary-color)" }}>
                          ₱{product.price.toFixed(2)}
                        </strong>
                        <small
                          style={{
                            color:
                              product.stock_quantity <= 10 ? "#f59e0b" : "#666",
                          }}
                        >
                          Stock: {product.stock_quantity}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="cart-section">
          <div
            className="card"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <div className="card-header">
              <h3>
                <ShoppingCart size={20} />
                Cart ({cart.length})
              </h3>
              {cart.length > 0 && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={clearCart}
                >
                  Clear All
                </button>
              )}
            </div>

            <div
              className="card-body"
              style={{ flex: 1, overflow: "auto", padding: "0" }}
            >
              {cart.length === 0 ? (
                <div className="text-center p-4">
                  <ShoppingCart size={48} color="#ccc" />
                  <p className="text-muted mt-2">Cart is empty</p>
                </div>
              ) : (
                <div>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="cart-item"
                      style={{
                        padding: "1rem",
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h5
                          style={{ margin: "0 0 0.25rem 0", fontSize: "14px" }}
                        >
                          {item.product.name}
                        </h5>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          ₱{item.unit_price.toFixed(2)} each
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          style={{
                            width: "30px",
                            height: "30px",
                            padding: "0",
                          }}
                        >
                          <Minus size={14} />
                        </button>

                        <span style={{ minWidth: "30px", textAlign: "center" }}>
                          {item.quantity}
                        </span>

                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          style={{
                            width: "30px",
                            height: "30px",
                            padding: "0",
                          }}
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => removeFromCart(item.product.id)}
                          style={{
                            width: "30px",
                            height: "30px",
                            padding: "0",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ minWidth: "80px", textAlign: "right" }}>
                        <strong>₱{item.total_price.toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div
                className="card-footer"
                style={{ borderTop: "1px solid #eee" }}
              >
                {/* Enhanced Discount Selection with validation */}
                <div className="form-group mb-3">
                  <label className="form-label">Apply Discount</label>
                  {discountsLoading ? (
                    <div className="text-center">
                      <LoadingSpinner size="sm" />
                      <small>Loading discounts...</small>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedDiscount?.id || ""}
                        onChange={(e) => {
                          const discount = discounts.find(
                            (d) => d.id === parseInt(e.target.value)
                          );
                          setSelectedDiscount(discount || null);
                        }}
                        className="form-select"
                      >
                        <option value="">No Discount</option>
                        {discounts.map((discount) => (
                          <option key={discount.id} value={discount.id}>
                            {discount.name} -{" "}
                            {discount.type === "percentage"
                              ? `${Number(discount.value).toFixed(1)}%`
                              : `₱${Number(discount.value).toFixed(2)}`}
                            {discount.minimum_amount &&
                              ` (Min: ₱${Number(
                                discount.minimum_amount
                              ).toFixed(2)})`}
                          </option>
                        ))}
                      </select>

                      {/* Show warning if minimum amount not met */}
                      {selectedDiscount &&
                        selectedDiscount.minimum_amount &&
                        subtotal < Number(selectedDiscount.minimum_amount) && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              padding: "0.5rem",
                              backgroundColor: "#fff3cd",
                              border: "1px solid #ffeaa7",
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#856404",
                            }}
                          >
                            <strong>⚠️ Minimum amount required:</strong> ₱
                            {Number(selectedDiscount.minimum_amount).toFixed(2)}
                            <br />
                            <small>
                              Current subtotal: ₱{subtotal.toFixed(2)} (Need ₱
                              {(
                                Number(selectedDiscount.minimum_amount) -
                                subtotal
                              ).toFixed(2)}{" "}
                              more)
                            </small>
                          </div>
                        )}

                      {/* Show discount applied message */}
                      {selectedDiscount &&
                        isDiscountValid &&
                        discountAmount > 0 && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              padding: "0.5rem",
                              backgroundColor: "#d4edda",
                              border: "1px solid #c3e6cb",
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#155724",
                            }}
                          >
                            <strong>✅ Discount applied:</strong> -₱
                            {discountAmount.toFixed(2)}
                          </div>
                        )}
                    </>
                  )}

                  {discounts.length === 0 && !discountsLoading && (
                    <small className="text-muted">
                      No active discounts available
                    </small>
                  )}
                </div>

                {/* Totals */}
                <div className="totals mb-3">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span>Subtotal:</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                        color: "green",
                      }}
                    >
                      <span>Discount:</span>
                      <span>-₱{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span>Tax (8%):</span>
                    <span>₱{taxAmount.toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "bold",
                      fontSize: "18px",
                      borderTop: "1px solid #ddd",
                      paddingTop: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <span>Total:</span>
                    <span>₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className={`btn w-full ${
                    !isDiscountValid ? "btn-secondary" : "btn-primary"
                  }`}
                  onClick={() => setShowCheckout(true)}
                  disabled={!isDiscountValid}
                  style={{
                    width: "100%",
                    opacity: !isDiscountValid ? 0.6 : 1,
                    cursor: !isDiscountValid ? "not-allowed" : "pointer",
                  }}
                >
                  <CreditCard size={16} />
                  {!isDiscountValid ? "Minimum Amount Not Met" : "Checkout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Checkout</h3>
              <button
                className="modal-close"
                onClick={() => setShowCheckout(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="form-input"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Email (Optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter customer email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="form-select"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="digital_wallet">Digital Wallet</option>
                </select>
              </div>

              {paymentMethod === "cash" && (
                <div className="form-group">
                  <label className="form-label">Amount Paid</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="form-input"
                    placeholder="Enter amount paid"
                    step="0.01"
                    min={totalAmount}
                  />
                  {parseFloat(amountPaid || "0") >= totalAmount && (
                    <small style={{ color: "green" }}>
                      Change: ₱{changeAmount.toFixed(2)}
                    </small>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div
                className="order-summary"
                style={{
                  background: "#f8f9fa",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginTop: "1rem",
                }}
              >
                <h4>Order Summary</h4>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Subtotal:</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "green",
                    }}
                  >
                    <span>Discount:</span>
                    <span>-₱{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Tax:</span>
                  <span>₱{taxAmount.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    borderTop: "1px solid #ddd",
                    paddingTop: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <span>Total:</span>
                  <span>₱{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCheckout}
                disabled={
                  createTransactionMutation.isLoading ||
                  (paymentMethod === "cash" &&
                    parseFloat(amountPaid || "0") < totalAmount)
                }
              >
                {createTransactionMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt size={16} />
                    Complete Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && completedTransaction && (
        <ReceiptPrinter
          transaction={completedTransaction}
          onClose={handleReceiptClose}
        />
      )}

      {/* Feedback Modal */}
      {showFeedback && completedTransaction && (
        <FeedbackForm
          transaction={completedTransaction}
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  );
};

export default POSPage;
