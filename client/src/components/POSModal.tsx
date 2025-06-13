import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { useQuery, useMutation } from "react-query";
import { productsAPI, discountsAPI, transactionsAPI } from "../services/api";
import LoadingSpinner from "./ui/LoadingSpinner";
import FeedbackForm from "./FeedbackForm";
import toast from "react-hot-toast";

interface POSModalProps {
  onClose: () => void;
  onTransactionComplete: () => void;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Transaction {
  id: number;
  transaction_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
}

const POSModal: React.FC<POSModalProps> = ({
  onClose,
  onTransactionComplete,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [completedTransaction, setCompletedTransaction] =
    useState<Transaction | null>(null);

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ["products", searchTerm],
    () => productsAPI.getAll({ search: searchTerm }),
    { keepPreviousData: true }
  );

  // Create transaction mutation
  const createTransactionMutation = useMutation(transactionsAPI.create, {
    onSuccess: (response) => {
      const transaction = response.data.transaction;
      setCompletedTransaction(transaction);
      toast.success("Transaction completed successfully!");

      // Show feedback form
      setShowFeedbackForm(true);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create transaction"
      );
    },
  });

  const products: Product[] = productsData?.data?.data || [];

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error("Not enough stock available");
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock_quantity <= 0) {
        toast.error("Product out of stock");
        return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      const product = cart.find(
        (item) => item.product.id === productId
      )?.product;
      if (product && quantity > product.stock_quantity) {
        toast.error("Not enough stock available");
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal;
  };

  const calculateChange = () => {
    if (paymentMethod !== "cash") return 0;
    const paid = parseFloat(amountPaid) || 0;
    const total = calculateTotal();
    return Math.max(0, paid - total);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    if (paymentMethod === "cash" && paid < total) {
      toast.error("Insufficient payment amount");
      return;
    }

    const transactionData = {
      customer_name: customerName || "Walk-in Customer",
      customer_email: customerEmail || "",
      payment_method: paymentMethod,
      amount_paid: paymentMethod === "cash" ? paid : total,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      })),
    };

    createTransactionMutation.mutate(transactionData);
  };

  const handleFeedbackComplete = () => {
    setShowFeedbackForm(false);
    setCompletedTransaction(null);
    onTransactionComplete();
    onClose();
  };

  const handleSkipFeedback = () => {
    setShowFeedbackForm(false);
    setCompletedTransaction(null);
    onTransactionComplete();
    onClose();
  };

  if (showFeedbackForm && completedTransaction) {
    return (
      <FeedbackForm
        transaction={completedTransaction}
        onClose={handleSkipFeedback}
        onSubmit={handleFeedbackComplete}
      />
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal pos-modal">
        <div className="modal-header">
          <h3 className="modal-title">Point of Sale</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pos-content">
          {/* Products Section */}
          <div className="pos-products">
            <div className="search-section mb-3">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="products-grid">
              {productsLoading ? (
                <div className="text-center p-4">
                  <LoadingSpinner />
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => addToCart(product)}
                  >
                    <h4>{product.name}</h4>
                    <p className="product-sku">{product.sku}</p>
                    <p className="product-price">₱{product.price.toFixed(2)}</p>
                    <p className="product-stock">
                      Stock: {product.stock_quantity}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="pos-cart">
            <h4>Cart ({cart.length} items)</h4>

            <div className="customer-info mb-3">
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input mb-2"
              />
              <input
                type="email"
                placeholder="Customer Email (Optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="text-muted text-center">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <div className="item-info">
                      <h5>{item.product.name}</h5>
                      <p>₱{item.product.price.toFixed(2)} each</p>
                    </div>
                    <div className="item-controls">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="btn btn-sm btn-secondary"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="btn btn-sm btn-secondary"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="btn btn-sm btn-danger ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="item-total">
                      ₱{(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Section */}
            <div className="payment-section">
              <div className="payment-method mb-3">
                <label className="form-label">Payment Method</label>
                <div className="payment-options">
                  <button
                    className={`payment-btn ${
                      paymentMethod === "cash" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Banknote size={16} />
                    Cash
                  </button>
                  <button
                    className={`payment-btn ${
                      paymentMethod === "card" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <CreditCard size={16} />
                    Card
                  </button>
                  <button
                    className={`payment-btn ${
                      paymentMethod === "digital_wallet" ? "active" : ""
                    }`}
                    onClick={() => setPaymentMethod("digital_wallet")}
                  >
                    <Smartphone size={16} />
                    Digital
                  </button>
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="form-group">
                  <label className="form-label">Amount Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
                {paymentMethod === "cash" && amountPaid && (
                  <div className="summary-row">
                    <span>Change:</span>
                    <span>₱{calculateChange().toFixed(2)}</span>
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg w-100"
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 || createTransactionMutation.isLoading
                }
              >
                {createTransactionMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .pos-modal {
            width: 95vw;
            max-width: 1200px;
            height: 90vh;
          }

          .pos-content {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 1rem;
            height: calc(90vh - 120px);
          }

          .pos-products {
            overflow-y: auto;
            padding-right: 1rem;
          }

          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
          }

          .product-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .product-card:hover {
            border-color: var(--primary-color);
            transform: translateY(-2px);
          }

          .product-card h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
          }

          .product-sku {
            color: var(--text-muted);
            font-size: 0.875rem;
            margin: 0;
          }

          .product-price {
            font-weight: 600;
            color: var(--primary-color);
            margin: 0.5rem 0;
          }

          .product-stock {
            font-size: 0.875rem;
            color: var(--text-muted);
            margin: 0;
          }

          .pos-cart {
            border-left: 1px solid var(--border-color);
            padding-left: 1rem;
            display: flex;
            flex-direction: column;
          }

          .cart-items {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 1rem;
          }

          .cart-item {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 1rem;
            align-items: center;
            padding: 0.75rem;
            border-bottom: 1px solid var(--border-color);
          }

          .item-info h5 {
            margin: 0;
            font-size: 0.875rem;
          }

          .item-info p {
            margin: 0;
            color: var(--text-muted);
            font-size: 0.75rem;
          }

          .item-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .quantity {
            min-width: 2rem;
            text-align: center;
            font-weight: 600;
          }

          .item-total {
            font-weight: 600;
            color: var(--primary-color);
          }

          .payment-options {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }

          .payment-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            background: var(--card-bg);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .payment-btn:hover {
            border-color: var(--primary-color);
          }

          .payment-btn.active {
            border-color: var(--primary-color);
            background: var(--primary-color);
            color: white;
          }

          .order-summary {
            background: var(--card-bg);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
          }

          .summary-row.total {
            font-weight: 600;
            font-size: 1.125rem;
            border-top: 1px solid var(--border-color);
            padding-top: 0.5rem;
            margin-top: 0.5rem;
          }

          @media (max-width: 768px) {
            .pos-modal {
              width: 100vw;
              height: 100vh;
            }

            .pos-content {
              grid-template-columns: 1fr;
              grid-template-rows: 1fr auto;
            }

            .pos-cart {
              border-left: none;
              border-top: 1px solid var(--border-color);
              padding-left: 0;
              padding-top: 1rem;
              max-height: 50vh;
            }

            .products-grid {
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default POSModal;
