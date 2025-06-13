import React, { useState } from "react";
import { X, Star, Send } from "lucide-react";
import { useMutation } from "react-query";
import { feedbackAPI } from "../services/api";
import LoadingSpinner from "./ui/LoadingSpinner";
import toast from "react-hot-toast";

interface Transaction {
  id: number;
  transaction_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
}

interface FeedbackFormProps {
  transaction: Transaction;
  onClose: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  transaction,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>(
    transaction.customer_name || ""
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    transaction.customer_email || ""
  );

  const submitFeedbackMutation = useMutation(feedbackAPI.create, {
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      onClose();
    },
    onError: (error: any) => {
      console.error("Feedback submission error:", error);
      console.error("Error response:", error.response);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to submit feedback";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const feedbackData = {
      transaction_id: transaction.id,
      customer_name: customerName,
      customer_email: customerEmail,
      rating,
      comment,
    };

    console.log("Submitting feedback:", feedbackData);
    submitFeedbackMutation.mutate(feedbackData);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h3 className="modal-title">How was your experience?</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="text-center mb-4">
              <p>We'd love to hear about your shopping experience!</p>
              <small className="text-muted">
                Transaction: {transaction.transaction_number}
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Email *</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rating *</label>
              <div
                className="rating-stars"
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  margin: "1rem 0",
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem",
                    }}
                  >
                    <Star
                      size={32}
                      fill={star <= rating ? "#fbbf24" : "none"}
                      color={star <= rating ? "#fbbf24" : "#d1d5db"}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center">
                <small className="text-muted">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </small>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comments (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Tell us about your experience..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSkip}
              disabled={submitFeedbackMutation.isLoading}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitFeedbackMutation.isLoading}
            >
              {submitFeedbackMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
