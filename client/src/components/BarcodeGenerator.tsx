import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { X, Download, Printer } from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
}

interface BarcodeGeneratorProps {
  product: Product;
  onClose: () => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  product,
  onClose,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, product.barcode, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [product.barcode]);

  const handleDownload = () => {
    if (barcodeRef.current) {
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const link = document.createElement("a");
        link.download = `barcode-${product.sku}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && barcodeRef.current) {
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${product.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .barcode-container {
                border: 1px solid #ddd;
                padding: 20px;
                margin: 20px auto;
                max-width: 400px;
                background: white;
              }
              .product-info {
                margin-bottom: 20px;
              }
              .product-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .product-details {
                font-size: 14px;
                color: #666;
              }
              @media print {
                body { margin: 0; }
                .barcode-container { 
                  border: none; 
                  margin: 0;
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-details">SKU: ${product.sku}</div>
                <div class="product-details">Price: ₱${product.price.toFixed(
                  2
                )}</div>
              </div>
              ${svgData}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h3 className="modal-title">Product Barcode</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body text-center">
          <div className="product-info mb-3">
            <h4>{product.name}</h4>
            <p className="text-muted">SKU: {product.sku}</p>
            <p className="text-muted">Price: ₱{product.price.toFixed(2)}</p>
          </div>

          <div
            className="barcode-container"
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "8px",
              background: "white",
            }}
          >
            <svg ref={barcodeRef}></svg>
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
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
