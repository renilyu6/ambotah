import React, { useRef, useState } from "react";
import MainLayout from "../../../pages/layout/MainLayout";

interface FeedbackFieldErrors {
  name?: string[];
  email?: string[];
  message?: string[];
}

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setAlert({ type: "", message: "" });

    try {
      const response = await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            (
              document.querySelector(
                'meta[name="csrf-token"]'
              ) as HTMLMetaElement
            )?.content || "",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAlert({ type: "success", message: "Feedback submitted!" });
        setFormData({ name: "", email: "", message: "" });
      } else if (response.status === 422) {
        const data = await response.json();
        setErrors(data.errors);
      } else {
        setAlert({ type: "danger", message: "An error occurred." });
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Server error." });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert({ type: "", message: "" }), 5000);
    }
  };

  const content = (
    <form
      className="d-flex justify-content-center flex-column align-items-center w-50 mx-auto mt-5 bg-secondary-subtle p-4 rounded-3"
      ref={formRef}
      onSubmit={handleSubmit}
    >
      {alert.message && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="mb-3 w-100">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && <div className="text-danger">{errors.name[0]}</div>}
      </div>

      <div className="mb-3 w-100">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          className={`form-control ${errors.email ? "is-invalid" : ""}`}
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <div className="text-danger">{errors.email[0]}</div>}
      </div>

      <div className="mb-3 w-100">
        <label htmlFor="message">Message</label>
        <textarea
          name="message"
          className={`form-control ${errors.message ? "is-invalid" : ""}`}
          value={formData.message}
          onChange={handleChange}
        ></textarea>
        {errors.message && (
          <div className="text-danger">{errors.message[0]}</div>
        )}
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
  return <MainLayout content={content} />;
};

export default Feedback;