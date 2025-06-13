import React, { useRef } from "react";
import { X, Download, Printer } from "lucide-react";
import JsBarcode from "jsbarcode";

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
  items: TransactionItem[];
  created_at: string;
}

interface TransactionItem {
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

interface ReceiptPrinterProps {
  transaction: Transaction;
  onClose: () => void;
}

const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  transaction,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Helper function to safely convert to number and format
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  const formatNumber = (num: number | string): number => {
    const numValue = typeof num === "string" ? parseFloat(num) : num;
    return isNaN(numValue) ? 0 : numValue;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && receiptRef.current) {
      const receiptContent = receiptRef.current.innerHTML;

      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${transaction.transaction_number}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 0;
                padding: 20px;
                font-size: 12px;
                line-height: 1.4;
              }
              .receipt {
                max-width: 300px;
                margin: 0 auto;
                background: white;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .company-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .company-tagline {
                font-size: 10px;
                margin-bottom: 10px;
              }
              .transaction-info {
                margin-bottom: 15px;
                font-size: 10px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
              }
              .items-table th,
              .items-table td {
                text-align: left;
                padding: 2px 0;
                font-size: 10px;
              }
              .items-table th {
                border-bottom: 1px solid #000;
                font-weight: bold;
              }
              .item-name {
                max-width: 120px;
                word-wrap: break-word;
              }
              .text-right {
                text-align: right;
              }
              .totals {
                border-top: 1px solid #000;
                padding-top: 10px;
                margin-bottom: 15px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              .total-final {
                font-weight: bold;
                font-size: 14px;
                border-top: 1px solid #000;
                padding-top: 5px;
                margin-top: 5px;
              }
              .footer {
                text-align: center;
                border-top: 2px solid #000;
                padding-top: 10px;
                font-size: 10px;
              }
              .barcode-container {
                text-align: center;
                margin: 15px 0;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 10px;
                }
                .receipt { 
                  max-width: none;
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            ${receiptContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      // Create a temporary canvas to convert HTML to image
      import("html2canvas").then((html2canvas) => {
        html2canvas.default(receiptRef.current!).then((canvas) => {
          const link = document.createElement("a");
          link.download = `receipt-${transaction.transaction_number}.png`;
          link.href = canvas.toDataURL();
          link.click();
        });
      });
    }
  };

  const generateReceiptBarcode = () => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, transaction.transaction_number, {
      format: "CODE128",
      width: 1,
      height: 40,
      displayValue: true,
      fontSize: 10,
      margin: 0,
    });
    return canvas.toDataURL();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h3 className="modal-title">
            Receipt - {transaction.transaction_number}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div
            ref={receiptRef}
            className="receipt"
            style={{
              fontFamily: "'Courier New', monospace",
              maxWidth: "300px",
              margin: "0 auto",
              padding: "20px",
              background: "white",
              border: "1px solid #ddd",
            }}
          >
            {/* Header */}
            <div
              className="header"
              style={{
                textAlign: "center",
                borderBottom: "2px solid #000",
                paddingBottom: "10px",
                marginBottom: "15px",
              }}
            >
              <div
                className="company-name"
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                ChicCheckout
              </div>
              <div
                className="company-tagline"
                style={{
                  fontSize: "10px",
                  marginBottom: "10px",
                }}
              >
                Beauty POS System
              </div>
              <div style={{ fontSize: "10px" }}>
                Thank you for your purchase!
              </div>
            </div>

            {/* Transaction Info */}
            <div
              className="transaction-info"
              style={{
                marginBottom: "15px",
                fontSize: "10px",
              }}
            >
              <div>
                <strong>Receipt #:</strong> {transaction.transaction_number}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(transaction.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Cashier:</strong> {transaction.user.first_name}{" "}
                {transaction.user.last_name}
              </div>
              {transaction.customer_name && (
                <div>
                  <strong>Customer:</strong> {transaction.customer_name}
                </div>
              )}
              {transaction.customer_email && (
                <div>
                  <strong>Email:</strong> {transaction.customer_email}
                </div>
              )}
            </div>

            {/* Items */}
            <table
              className="items-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "15px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: "1px solid #000",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #000",
                      fontSize: "10px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #000",
                      fontSize: "10px",
                      fontWeight: "bold",
                      textAlign: "right",
                    }}
                  >
                    Price
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #000",
                      fontSize: "10px",
                      fontWeight: "bold",
                      textAlign: "right",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        fontSize: "10px",
                        maxWidth: "120px",
                        wordWrap: "break-word",
                      }}
                    >
                      {item.product.name}
                      <br />
                      <small style={{ color: "#666" }}>
                        {item.product.sku}
                      </small>
                    </td>
                    <td style={{ fontSize: "10px", textAlign: "center" }}>
                      {formatNumber(item.quantity)}
                    </td>
                    <td style={{ fontSize: "10px", textAlign: "right" }}>
                      ₱{formatPrice(item.unit_price)}
                    </td>
                    <td style={{ fontSize: "10px", textAlign: "right" }}>
                      ₱{formatPrice(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div
              className="totals"
              style={{
                borderTop: "1px solid #000",
                paddingTop: "10px",
                marginBottom: "15px",
              }}
            >
              <div
                className="total-line"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "10px",
                }}
              >
                <span>Subtotal:</span>
                <span>₱{formatPrice(transaction.subtotal)}</span>
              </div>

              {formatNumber(transaction.discount_amount) > 0 && (
                <div
                  className="total-line"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "3px",
                    fontSize: "10px",
                  }}
                >
                  <span>Discount:</span>
                  <span>-₱{formatPrice(transaction.discount_amount)}</span>
                </div>
              )}

              <div
                className="total-line"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "10px",
                }}
              >
                <span>Tax (8%):</span>
                <span>₱{formatPrice(transaction.tax_amount)}</span>
              </div>
              <div
                className="total-final"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: "14px",
                  borderTop: "1px solid #000",
                  paddingTop: "5px",
                  marginTop: "5px",
                }}
              >
                <span>TOTAL:</span>
                <span>₱{formatPrice(transaction.total_amount)}</span>
              </div>

              <div
                className="total-line"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "10px",
                  marginTop: "5px",
                }}
              >
                <span>
                  Payment ({transaction.payment_method.replace("_", " ")}):
                </span>
                <span>₱{formatPrice(transaction.amount_paid)}</span>
              </div>

              <div
                className="total-line"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                  fontSize: "10px",
                }}
              >
                <span>Change:</span>
                <span>₱{formatPrice(transaction.change_amount)}</span>
              </div>
            </div>

            {/* Barcode */}
            <div
              className="barcode-container"
              style={{
                textAlign: "center",
                margin: "15px 0",
              }}
            >
              <img
                src={generateReceiptBarcode()}
                alt={`Barcode ${transaction.transaction_number}`}
                style={{ maxWidth: "100%" }}
              />
            </div>

            {/* Footer */}
            <div
              className="footer"
              style={{
                textAlign: "center",
                borderTop: "2px solid #000",
                paddingTop: "10px",
                fontSize: "10px",
              }}
            >
              <div>Thank you for shopping with us!</div>
              <div>Visit us again soon!</div>
              <div style={{ marginTop: "10px" }}>
                ChicCheckout Beauty POS System
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDownload}
          >
            <Download size={16} />
            Download
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter;
