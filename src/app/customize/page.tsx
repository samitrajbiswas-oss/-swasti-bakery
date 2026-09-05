"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function CustomizeCakePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    budget: 250,
    flavor: "",
    design: "",
    message: "",
    date: "",
    time: "",
    fulfillment: "pickup",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    setError("");
    setSuccess(false);

    // Check login
    const user = auth.currentUser;

    if (!user) {
      router.push("/login");
      return;
    }

    // Validate required fields
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.area.trim() ||
      form.budget < 250 ||
      form.budget > 2000 ||
      !form.flavor.trim() ||
      !form.design.trim() ||
      !form.date ||
      !form.time
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/cake-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.name.trim(),
          phone: form.phone.trim(),
          area: form.area.trim(),
          email: user.email || "",

          cakeSize: `Budget ₹${form.budget}`,
          flavor: form.flavor.trim(),
          design: form.design.trim(),
          message: form.message.trim(),

          requiredDate: form.date,
          preferredTime: form.time,

          fulfillment: form.fulfillment,

          deliveryChargeApplicable:
            form.fulfillment === "delivery",

          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit request."
        );
      }

      console.log(
        "Cake request submitted:",
        result.requestId
      );

      // Save the request ID so this exact cake request can open its private chat.
      setSubmittedRequestId(result.requestId);

      // Success
      setSuccess(true);

      // Clear form
      setForm({
        name: "",
        phone: "",
        area: "",
        budget: 250,
        flavor: "",
        design: "",
        message: "",
        date: "",
        time: "",
        fulfillment: "pickup",
      });
    } catch (err) {
      console.error("Cake request error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "We couldn't submit your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page">
      <div className="container">

        {/* Header */}
        <div className="header">
          <div className="badge">
            🍰 CUSTOM CAKE
          </div>

          <h1>Design Your Dream Cake</h1>

          <p>
            Tell us what you have in mind and we'll create a
            delicious cake specially for you.
          </p>

          <div className="features">
            <span>🌱 100% Eggless</span>
            <span>🥬 Vegetarian</span>
            <span>❤️ Made with Care</span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="form"
        >

          {/* Customer Details */}
          <section>
            <h2>Customer Details</h2>

            <div className="grid">

              <div className="field">
                <label>
                  Your Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="field">
                <label>
                  Phone Number <span>*</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                />
              </div>

              <div className="field">
                <label>
                  Area <span>*</span>
                </label>

                <input
                  type="text"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="Enter your area / locality"
                  required
                />
              </div>

            </div>
          </section>

          {/* Cake Details */}
          <section>
            <h2>Cake Details</h2>

            <div className="grid">

              <div className="field">
                <label>
                  Estimated Budget <span>*</span>
                </label>

                <div className="budget-counter">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        budget: Math.max(250, prev.budget - 50),
                      }))
                    }
                    disabled={form.budget <= 250}
                    aria-label="Decrease budget"
                  >
                    −
                  </button>

                  <div className="budget-value">
                    <span>₹{form.budget}</span>
                    <small>₹50 steps • ₹250–₹2,000</small>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        budget: Math.min(2000, prev.budget + 50),
                      }))
                    }
                    disabled={form.budget >= 2000}
                    aria-label="Increase budget"
                  >
                    +
                  </button>
                </div>

                <p className="helper-text">
                  This helps us understand the approximate budget for your cake.
                  The final price may vary depending on the design and ingredients.
                </p>
              </div>

              <div className="field">
                <label>
                  Flavor <span>*</span>
                </label>

                <input
                  type="text"
                  name="flavor"
                  value={form.flavor}
                  onChange={handleChange}
                  placeholder="Chocolate, Vanilla, Butterscotch..."
                  required
                />
              </div>

            </div>

            <div className="field">
              <label>
                Design / Theme <span>*</span>
              </label>

              <textarea
                name="design"
                value={form.design}
                onChange={handleChange}
                placeholder="Describe the cake design or theme you want..."
                rows={4}
                required
              />
            </div>

            <div className="field">
              <label>
                Message on Cake
              </label>

              <input
                type="text"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Happy Birthday Mom!"
              />
            </div>
          </section>

          {/* Date & Time */}
          <section>
            <h2>When Do You Need It?</h2>

            <div className="grid">

              <div className="field">
                <label>
                  Required Date <span>*</span>
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>
                  Preferred Time <span>*</span>
                </label>

                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select a time of day
                  </option>
                  <option value="Morning">
                    🌅 Morning
                  </option>
                  <option value="Afternoon">
                    ☀️ Afternoon
                  </option>
                  <option value="Evening">
                    🌇 Evening
                  </option>
                  <option value="Night">
                    🌙 Night
                  </option>
                </select>
              </div>

            </div>
          </section>

          {/* Pickup / Delivery */}
          <section>
            <h2>
              How Would You Like To Receive It?
            </h2>

            <div className="delivery-options">

              <label
                className={`delivery-card ${
                  form.fulfillment === "pickup"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  value="pickup"
                  checked={
                    form.fulfillment === "pickup"
                  }
                  onChange={handleChange}
                />

                <div>
                  <strong>🏪 Pickup</strong>

                  <p>
                    I'll collect the cake from the bakery.
                  </p>
                </div>
              </label>

              <label
                className={`delivery-card ${
                  form.fulfillment === "delivery"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  value="delivery"
                  checked={
                    form.fulfillment === "delivery"
                  }
                  onChange={handleChange}
                />

                <div>
                  <strong>🛵 Delivery</strong>

                  <p>
                    Extra delivery charges will apply.
                  </p>
                </div>
              </label>

            </div>

            {form.fulfillment === "delivery" && (
              <p className="delivery-note">
                📍 Delivery will be arranged based on the area you provided.
              </p>
            )}
          </section>

          {/* Error */}
          {error && (
            <div className="error">
              ❌ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="success">
              <div className="success-icon">
                ✓
              </div>

              <div>
                <h3>
                  Request Submitted!
                </h3>

                <p>
                  Thank you! Your cake request has been
                  received. We'll review the details and
                  get back to you soon.
                </p>
              </div>
            </div>
          )}

          {/* Chat with The Baker - available only after a successful request */}
          {success && submittedRequestId && (
            <button
              type="button"
              className="chat-button"
              onClick={() =>
                router.push(`/chat?requestId=${submittedRequestId}`)
              }
            >
              💬 Chat with The Baker
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="submit"
          >
            {submitting
              ? "Submitting Request..."
              : "Submit Cake Request 🍰"}
          </button>

          <p className="note">
            🔒 Your information is securely stored and will
            only be used to process your cake request.
          </p>

        </form>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #fff8f3;
          padding: 50px 20px;
          color: #3b2118;
        }

        .container {
          max-width: 900px;
          margin: auto;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .badge {
          display: inline-block;
          background: #ffe6d5;
          color: #8b451f;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }

        h1 {
          font-size: 42px;
          margin: 0 0 12px;
          color: #4a2517;
        }

        .header p {
          font-size: 17px;
          color: #725448;
          max-width: 600px;
          margin: auto;
          line-height: 1.6;
        }

        .features {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 20px;
          color: #704532;
          font-weight: 600;
        }

        .form {
          background: white;
          border-radius: 24px;
          padding: 35px;
          box-shadow: 0 10px 40px rgba(80, 40, 20, 0.08);
        }

        section {
          margin-bottom: 38px;
        }

        h2 {
          color: #4a2517;
          font-size: 25px;
          margin-bottom: 22px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
        }

        .field {
          margin-bottom: 22px;
        }

        .delivery-note {
          margin: 18px 0 0;
          padding: 14px 16px;
          border-radius: 12px;
          background: #fff7f0;
          color: #765447;
          font-size: 14px;
          line-height: 1.5;
        }

        label {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: #4a2517;
          margin-bottom: 9px;
        }

        label span {
          color: #d45151;
        }

        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1.5px solid #e6cfc2;
          border-radius: 12px;
          background: #fff;
          color: #3b2118;
          font-size: 16px;
          outline: none;
          transition: 0.2s;
        }

        input::placeholder,
        textarea::placeholder {
          color: #a8948a;
          opacity: 1;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #b76e4c;
          box-shadow: 0 0 0 3px rgba(183, 110, 76, 0.12);
        }

        textarea {
          resize: vertical;
        }

        select {
          cursor: pointer;
        }

        .budget-counter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px;
          border: 1.5px solid #e6cfc2;
          border-radius: 15px;
          background: #fffaf7;
        }

        .budget-counter button {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 12px;
          background: #8b4a2f;
          color: white;
          font-size: 28px;
          line-height: 1;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .budget-counter button:hover:not(:disabled) {
          background: #71391f;
          transform: translateY(-1px);
        }

        .budget-counter button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .budget-value {
          flex: 1;
          text-align: center;
        }

        .budget-value span {
          display: block;
          font-size: 30px;
          font-weight: 800;
          color: #4a2517;
        }

        .budget-value small {
          display: block;
          margin-top: 3px;
          color: #907a70;
          font-size: 12px;
        }

        .helper-text {
          margin: 8px 0 0;
          color: #907a70;
          font-size: 13px;
          line-height: 1.5;
        }

        .delivery-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        .delivery-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px;
          border: 1.5px solid #e6cfc2;
          border-radius: 15px;
          cursor: pointer;
          transition: 0.2s;
        }

        .delivery-card input {
          width: auto;
          accent-color: #a95c3c;
        }

        .delivery-card p {
          margin: 5px 0 0;
          color: #80665a;
          font-size: 13px;
        }

        .delivery-card.selected {
          border-color: #a95c3c;
          background: #fff7f1;
        }

        .error {
          background: #fff0f0;
          border: 1px solid #e8aaaa;
          color: #a22b2b;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .success {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          background: #effaf2;
          border: 1px solid #a8d9b3;
          color: #245c30;
          padding: 18px;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .success-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b9b50;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .success h3 {
          margin: 0 0 5px;
        }

        .success p {
          margin: 0;
          line-height: 1.5;
        }

        .chat-button {
          width: 100%;
          border: 1.5px solid #a95c3c;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 12px;
          background: #fff7f1;
          color: #8b4a2f;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .chat-button:hover {
          background: #ffeadb;
          transform: translateY(-1px);
        }

        .submit {
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 17px;
          background: #8b4a2f;
          color: white;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .submit:hover:not(:disabled) {
          background: #71391f;
          transform: translateY(-1px);
        }

        .submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .note {
          text-align: center;
          color: #907a70;
          font-size: 13px;
          margin: 16px 0 0;
        }

        @media (max-width: 700px) {
          .page {
            padding: 25px 12px;
          }

          .form {
            padding: 22px;
            border-radius: 18px;
          }

          h1 {
            font-size: 32px;
          }

          .grid,
          .delivery-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}