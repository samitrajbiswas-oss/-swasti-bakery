"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type ChatMessage = {
  id: string;
  senderType: "CUSTOMER" | "ADMIN";
  senderUserId: string | null;
  message: string;
  createdAt: string;
};

type CakeRequest = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  cakeSize: string;
  flavor: string;
  design: string;
  message: string | null;
  requiredDate: string;
  preferredTime: string;
  fulfillment: string;
  deliveryAddress: string | null;
  deliveryChargeApplicable: boolean;
  eggless: boolean;
  vegetarian: boolean;
  status: string;
  createdAt: string;
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [request, setRequest] = useState<CakeRequest | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const getToken = async () => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please log in first.");
    }

    return user.getIdToken();
  };

  const loadChat = async (showLoading = false) => {
    if (!requestId) {
      setError("No cake request was selected.");
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const token = await getToken();

      const response = await fetch(
        `/api/chat?requestId=${encodeURIComponent(requestId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load chat.");
      }

      setRequest(result.request);
      setMessages(result.conversation.messages);
    } catch (err) {
      console.error("Chat loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the chat."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      await loadChat(true);
    });

    return () => unsubscribe();
  }, [requestId]);

  /*
   * Refresh the conversation periodically so that if the baker
   * sends a message, the customer sees it without needing to
   * manually refresh the page.
   */
  useEffect(() => {
    if (!requestId || loading || error) return;

    const interval = setInterval(() => {
      loadChat(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [requestId, loading, error]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending || !requestId) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const token = await getToken();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          message: trimmedMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to send message."
        );
      }

      setMessage("");

      await loadChat(false);
    } catch (err) {
      console.error("Send message error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading your chat...</p>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #fff8f3;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4a2517;
          }

          .loading {
            text-align: center;
          }

          .spinner {
            width: 36px;
            height: 36px;
            margin: 0 auto 15px;
            border: 4px solid #f1d8c8;
            border-top-color: #8b4a2f;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          p {
            margin: 0;
            font-size: 16px;
          }
        `}</style>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="page">
        <div className="error-card">
          <h1>Chat unavailable</h1>
          <p>{error || "We couldn't find this cake request."}</p>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/customize";
            }}
          >
            Back to Customize Cake
          </button>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            background: #fff8f3;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #4a2517;
          }

          .error-card {
            width: 100%;
            max-width: 500px;
            background: white;
            padding: 35px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(80, 40, 20, 0.08);
          }

          h1 {
            margin: 0 0 10px;
          }

          p {
            color: #725448;
            margin-bottom: 25px;
          }

          button {
            border: none;
            border-radius: 12px;
            padding: 13px 20px;
            background: #8b4a2f;
            color: white;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="chat-container">

        {/* Header */}
        <header className="header">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              window.location.href = "/customize";
            }}
          >
            ← Back
          </button>

          <div>
            <h1>Chat with The Baker</h1>
            <p>Discuss your cake request directly with us.</p>
          </div>
        </header>

        {/* Cake Request */}
        <section className="request-card">
          <div className="request-title">
            <div>
              <span className="label">YOUR CAKE REQUEST</span>
              <h2>{request.customerName}</h2>
            </div>

            <span className="status">
              {request.status}
            </span>
          </div>

          <div className="details">
            <div>
              <span>Cake</span>
              <strong>{request.cakeSize}</strong>
            </div>

            <div>
              <span>Flavor</span>
              <strong>{request.flavor}</strong>
            </div>

            <div>
              <span>Design</span>
              <strong>{request.design}</strong>
            </div>

            <div>
              <span>Required Date</span>
              <strong>{request.requiredDate}</strong>
            </div>

            <div>
              <span>Preferred Time</span>
              <strong>{request.preferredTime}</strong>
            </div>

            <div>
              <span>Fulfillment</span>
              <strong>
                {request.fulfillment === "delivery"
                  ? "Delivery"
                  : "Pickup"}
              </strong>
            </div>

            {request.fulfillment === "delivery" &&
              request.deliveryAddress && (
                <div className="full">
                  <span>Delivery Address</span>
                  <strong>{request.deliveryAddress}</strong>
                </div>
              )}

            {request.message && (
              <div className="full">
                <span>Message on Cake</span>
                <strong>{request.message}</strong>
              </div>
            )}
          </div>

          <div className="badges">
            {request.eggless && <span>🌱 Eggless</span>}
            {request.vegetarian && <span>🥬 Vegetarian</span>}
          </div>
        </section>

        {/* Chat */}
        <section className="chat-card">
          <div className="chat-header">
            <strong>Conversation</strong>
            <span>Private chat</span>
          </div>

          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-icon">💬</div>
                <h3>Start the conversation</h3>
                <p>
                  You can ask The Baker anything about your cake
                  request.
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const isCustomer =
                  item.senderType === "CUSTOMER";

                return (
                  <div
                    key={item.id}
                    className={`message-row ${
                      isCustomer ? "customer" : "admin"
                    }`}
                  >
                    <div className="message-bubble">
                      <span className="sender">
                        {isCustomer ? "You" : "The Baker"}
                      </span>

                      <p>{item.message}</p>

                      <time>
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </time>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="composer">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={2}
              maxLength={2000}
              disabled={sending}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>

          <p className="composer-note">
            Press Enter to send • Shift + Enter for a new line
          </p>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #fff8f3;
          padding: 30px 15px;
          color: #3b2118;
        }

        .chat-container {
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .back-button {
          border: 1px solid #e6cfc2;
          background: white;
          color: #6b4636;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          color: #4a2517;
        }

        .header p {
          margin: 4px 0 0;
          color: #80665a;
          font-size: 14px;
        }

        .request-card,
        .chat-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(80, 40, 20, 0.07);
        }

        .request-card {
          padding: 22px;
          margin-bottom: 18px;
        }

        .request-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 18px;
          border-bottom: 1px solid #f0ded4;
        }

        .label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #a95c3c;
        }

        h2 {
          margin: 5px 0 0;
          font-size: 21px;
        }

        .status {
          background: #fff0df;
          color: #8b4a2f;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding-top: 18px;
        }

        .details div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .details .full {
          grid-column: 1 / -1;
        }

        .details span {
          color: #967f74;
          font-size: 12px;
        }

        .details strong {
          color: #4a3025;
          font-size: 14px;
          line-height: 1.4;
        }

        .badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .badges span {
          background: #f2faf3;
          color: #397047;
          border-radius: 20px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .chat-card {
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 17px 20px;
          border-bottom: 1px solid #f0ded4;
        }

        .chat-header strong {
          font-size: 17px;
        }

        .chat-header span {
          color: #967f74;
          font-size: 12px;
        }

        .messages {
          min-height: 350px;
          max-height: 500px;
          overflow-y: auto;
          padding: 20px;
          background: #fffaf7;
        }

        .message-row {
          display: flex;
          margin-bottom: 13px;
        }

        .message-row.customer {
          justify-content: flex-end;
        }

        .message-row.admin {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 75%;
          padding: 11px 14px;
          border-radius: 15px;
        }

        .customer .message-bubble {
          background: #8b4a2f;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .admin .message-bubble {
          background: white;
          color: #3b2118;
          border: 1px solid #ead9d0;
          border-bottom-left-radius: 4px;
        }

        .sender {
          display: block;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 4px;
          opacity: 0.75;
        }

        .message-bubble p {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.45;
          font-size: 14px;
        }

        time {
          display: block;
          margin-top: 6px;
          font-size: 9px;
          opacity: 0.65;
        }

        .empty-chat {
          text-align: center;
          padding: 80px 20px;
          color: #80665a;
        }

        .empty-icon {
          font-size: 35px;
          margin-bottom: 10px;
        }

        .empty-chat h3 {
          margin: 0 0 5px;
          color: #4a3025;
        }

        .empty-chat p {
          margin: 0;
          font-size: 14px;
        }

        .error-message {
          margin: 12px 15px 0;
          padding: 10px 12px;
          border-radius: 10px;
          background: #fff0f0;
          border: 1px solid #e8aaaa;
          color: #a22b2b;
          font-size: 13px;
        }

        .composer {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid #f0ded4;
          background: white;
        }

        .composer textarea {
          flex: 1;
          resize: none;
          border: 1.5px solid #e6cfc2;
          border-radius: 12px;
          padding: 12px;
          font-family: inherit;
          font-size: 14px;
          color: #3b2118;
          outline: none;
        }

        .composer textarea:focus {
          border-color: #b76e4c;
        }

        .composer button {
          align-self: stretch;
          min-width: 75px;
          border: none;
          border-radius: 12px;
          background: #8b4a2f;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .composer button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .composer-note {
          margin: -7px 15px 13px;
          color: #a08b81;
          font-size: 10px;
          text-align: right;
        }

        @media (max-width: 600px) {
          .page {
            padding: 15px 10px;
          }

          .header {
            align-items: flex-start;
          }

          h1 {
            font-size: 23px;
          }

          .request-card {
            padding: 17px;
          }

          .details {
            grid-template-columns: 1fr;
          }

          .details .full {
            grid-column: auto;
          }

          .message-bubble {
            max-width: 88%;
          }

          .messages {
            min-height: 320px;
            max-height: 55vh;
          }

          .composer {
            flex-direction: column;
          }

          .composer button {
            min-height: 45px;
          }

          .composer-note {
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}