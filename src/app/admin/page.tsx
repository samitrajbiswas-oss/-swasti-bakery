"use client";

import { useEffect, useRef, useState } from "react";

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
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage() {
  const [requests, setRequests] = useState<CakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedChatRequestId, setSelectedChatRequestId] = useState<string | null>(null);
  const [selectedChatRequest, setSelectedChatRequest] = useState<CakeRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // =========================================
  // LOAD ADMIN REQUESTS
  // =========================================

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/cake-request",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      // No valid admin session
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load requests."
        );
      }

      setRequests(data.requests);
      setCheckingAccess(false);
    } catch (err) {
      console.error(
        "Admin request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load cake requests."
      );

      setCheckingAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // CHECK ADMIN ACCESS
  // =========================================

  useEffect(() => {
    loadRequests();
  }, []);

  // =========================================
  // DELETE REQUEST
  // =========================================

  const deleteRequest = async (requestId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this cake request?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(requestId);
      setError("");

      const response = await fetch("/api/cake-request", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: requestId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete request.");
      }

      setRequests((current) =>
        current.filter((request) => request.id !== requestId)
      );

      if (selectedChatRequestId === requestId) {
        closeChat();
      }
    } catch (err) {
      console.error("Delete request error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to delete request."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // LOAD CUSTOMER CHAT
  // =========================================

  const openChat = async (request: CakeRequest) => {
    try {
      setSelectedChatRequestId(request.id);
      setSelectedChatRequest(request);
      setChatMessages([]);
      setChatInput("");
      setChatError("");
      setChatLoading(true);

      const response = await fetch(
        `/api/chat?requestId=${encodeURIComponent(request.id)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load chat.");
      }

      setSelectedChatRequest(data.request);
      setChatMessages(data.conversation.messages);
    } catch (err) {
      console.error("Admin chat loading error:", err);
      setChatError(
        err instanceof Error
          ? err.message
          : "Unable to load chat."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const closeChat = () => {
    setSelectedChatRequestId(null);
    setSelectedChatRequest(null);
    setChatMessages([]);
    setChatInput("");
    setChatError("");
  };

  const sendAdminMessage = async () => {
    const trimmedMessage = chatInput.trim();

    if (!trimmedMessage || chatSending || !selectedChatRequestId) {
      return;
    }

    try {
      setChatSending(true);
      setChatError("");

      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedChatRequestId,
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send message.");
      }

      setChatInput("");

      const refreshResponse = await fetch(
        `/api/chat?requestId=${encodeURIComponent(selectedChatRequestId)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok || !refreshData.success) {
        throw new Error(
          refreshData.message || "Unable to refresh chat."
        );
      }

      setChatMessages(refreshData.conversation.messages);
      setSelectedChatRequest(refreshData.request);
    } catch (err) {
      console.error("Admin send message error:", err);
      setChatError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    } finally {
      setChatSending(false);
    }
  };

  const handleChatKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAdminMessage();
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  // =========================================
  // LOGOUT
  // =========================================

  const logout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    window.location.href = "/";
  };

  // =========================================
  // LOADING ACCESS
  // =========================================

  if (checkingAccess) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffafa",
          color: "#172033",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "10px",
            }}
          >
            🔐
          </div>

          <p
            style={{
              fontWeight: "700",
            }}
          >
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  // =========================================
  // DASHBOARD STATISTICS
  // =========================================

  const total = requests.length;

  const newRequests = requests.filter(
    (request) =>
      request.status === "NEW"
  ).length;

  const accepted = requests.filter(
    (request) =>
      request.status === "ACCEPTED"
  ).length;

  const completed = requests.filter(
    (request) =>
      request.status === "COMPLETED"
  ).length;

  // =========================================
  // ADMIN DASHBOARD
  // =========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: "800",
                color: "#172554",
              }}
            >
              🧁 Bakery Admin
            </h1>

            <p
              style={{
                marginTop: "5px",
                color: "#64748b",
              }}
            >
              Manage custom cake requests
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={loadRequests}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "10px",
                background: "#dc2626",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <SummaryCard
            title="Total"
            value={total}
          />

          <SummaryCard
            title="New"
            value={newRequests}
          />

          <SummaryCard
            title="Accepted"
            value={accepted}
          />

          <SummaryCard
            title="Completed"
            value={completed}
          />
        </div>

        {/* LOADING */}

        {loading && (
          <p
            style={{
              textAlign: "center",
              padding: "30px",
              color: "#64748b",
            }}
          >
            Loading requests...
          </p>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          requests.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "40px",
                borderRadius: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "45px",
                }}
              >
                🎂
              </div>

              <h2>
                No cake requests yet
              </h2>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                New custom cake requests
                will appear here.
              </p>
            </div>
          )}

        {/* ACTIVE CHAT */}
        {selectedChatRequestId && (
          <section
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "22px",
              marginBottom: "25px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
              border: "2px solid #dbeafe",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                  }}
                >
                  PRIVATE CUSTOMER CHAT
                </p>
                <h2
                  style={{
                    margin: "5px 0 3px",
                    color: "#172554",
                  }}
                >
                  {selectedChatRequest?.customerName || "Customer"}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  {selectedChatRequest?.email || ""}
                  {selectedChatRequest?.phone
                    ? ` • ${selectedChatRequest.phone}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closeChat}
                style={{
                  padding: "9px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  background: "white",
                  color: "#475569",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Close Chat
              </button>
            </div>

            {selectedChatRequest && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <ChatInfo label="Cake" value={selectedChatRequest.cakeSize} />
                <ChatInfo label="Flavor" value={selectedChatRequest.flavor} />
                <ChatInfo label="Date" value={selectedChatRequest.requiredDate} />
                <ChatInfo label="Time" value={selectedChatRequest.preferredTime} />
                <ChatInfo
                  label="Fulfillment"
                  value={
                    selectedChatRequest.fulfillment === "delivery"
                      ? "Delivery"
                      : "Pickup"
                  }
                />
              </div>
            )}

            {chatLoading ? (
              <div
                style={{
                  minHeight: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                Loading conversation...
              </div>
            ) : (
              <>
                <div
                  style={{
                    minHeight: "280px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    background: "#f8fafc",
                    borderRadius: "14px",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {chatMessages.length === 0 ? (
                    <div
                      style={{
                        minHeight: "245px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "38px", marginBottom: "8px" }}>
                          💬
                        </div>
                        <strong style={{ color: "#334155" }}>
                          No messages yet
                        </strong>
                        <p style={{ margin: "5px 0 0", fontSize: "13px" }}>
                          You can start the conversation with this customer.
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((item) => {
                      const isAdmin = item.senderType === "ADMIN";

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: isAdmin ? "flex-end" : "flex-start",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "75%",
                              padding: "11px 14px",
                              borderRadius: "14px",
                              background: isAdmin ? "#2563eb" : "white",
                              color: isAdmin ? "white" : "#334155",
                              border: isAdmin ? "none" : "1px solid #e2e8f0",
                              borderBottomRightRadius: isAdmin ? "4px" : "14px",
                              borderBottomLeftRadius: isAdmin ? "14px" : "4px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: "800",
                                opacity: 0.75,
                                marginBottom: "4px",
                              }}
                            >
                              {isAdmin ? "The Baker" : "Customer"}
                            </div>

                            <div
                              style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                lineHeight: 1.45,
                                fontSize: "14px",
                              }}
                            >
                              {item.message}
                            </div>

                            <div
                              style={{
                                marginTop: "5px",
                                fontSize: "9px",
                                opacity: 0.65,
                              }}
                            >
                              {new Date(item.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {chatError && (
                  <div
                    style={{
                      marginTop: "10px",
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "13px",
                    }}
                  >
                    {chatError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Write a message to the customer..."
                    rows={2}
                    maxLength={2000}
                    disabled={chatSending}
                    style={{
                      flex: 1,
                      resize: "none",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "12px",
                      padding: "12px",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      color: "#334155",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                  <button
                    type="button"
                    onClick={sendAdminMessage}
                    disabled={!chatInput.trim() || chatSending}
                    style={{
                      minWidth: "85px",
                      border: "none",
                      borderRadius: "12px",
                      background:
                        !chatInput.trim() || chatSending ? "#94a3b8" : "#2563eb",
                      color: "white",
                      fontWeight: "700",
                      cursor:
                        !chatInput.trim() || chatSending
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {chatSending ? "Sending..." : "Send"}
                  </button>
                </div>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#94a3b8",
                    fontSize: "10px",
                    textAlign: "right",
                  }}
                >
                  Enter to send • Shift + Enter for a new line
                </p>
              </>
            )}
          </section>
        )}

        {/* REQUESTS */}

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "22px",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.06)",
              }}
            >
              {/* CUSTOMER */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#172554",
                    }}
                  >
                    {request.customerName}
                  </h2>

                  <p
                    style={{
                      margin: "5px 0",
                      color: "#64748b",
                    }}
                  >
                    {request.phone}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                    }}
                  >
                    {request.email}
                  </p>
                </div>

                <span
                  style={{
                    height: "fit-content",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    background:
                      request.status ===
                      "NEW"
                        ? "#fef3c7"
                        : request.status ===
                          "ACCEPTED"
                        ? "#dbeafe"
                        : "#dcfce7",
                    fontWeight: "700",
                  }}
                >
                  {request.status}
                </span>
              </div>

              {/* DETAILS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                <Info
                  label="Cake Size"
                  value={request.cakeSize}
                />

                <Info
                  label="Flavor"
                  value={request.flavor}
                />

                <Info
                  label="Required Date"
                  value={
                    request.requiredDate
                  }
                />

                <Info
                  label="Preferred Time"
                  value={
                    request.preferredTime
                  }
                />

                <Info
                  label="Fulfillment"
                  value={
                    request.fulfillment
                  }
                />

                <Info
                  label="Eggless"
                  value={
                    request.eggless
                      ? "Yes"
                      : "No"
                  }
                />

                <Info
                  label="Vegetarian"
                  value={
                    request.vegetarian
                      ? "Yes"
                      : "No"
                  }
                />

                <Info
                  label="Delivery Charge"
                  value={
                    request.deliveryChargeApplicable
                      ? "Applicable"
                      : "Not applicable"
                  }
                />
              </div>

              {/* DESIGN */}

              <div
                style={{
                  marginTop: "18px",
                }}
              >
                <strong>
                  Design / Theme
                </strong>

                <p
                  style={{
                    color: "#475569",
                  }}
                >
                  {request.design}
                </p>
              </div>

              {/* MESSAGE */}

              {request.message && (
                <div
                  style={{
                    marginTop: "15px",
                  }}
                >
                  <strong>
                    Message on Cake
                  </strong>

                  <p
                    style={{
                      color: "#475569",
                    }}
                  >
                    {request.message}
                  </p>
                </div>
              )}

              {/* DELIVERY ADDRESS */}

              {request.deliveryAddress && (
                <div
                  style={{
                    marginTop: "15px",
                  }}
                >
                  <strong>
                    Delivery Address
                  </strong>

                  <p
                    style={{
                      color: "#475569",
                    }}
                  >
                    {request.deliveryAddress}
                  </p>
                </div>
              )}

              {/* REQUEST ID */}

              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "12px",
                  borderTop:
                    "1px solid #e2e8f0",
                  fontSize: "11px",
                  color: "#94a3b8",
                  wordBreak: "break-all",
                }}
              >
                Request ID: {request.id}
              </div>

              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => openChat(request)}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "10px",
                    background: "#2563eb",
                    color: "white",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  💬 Open Chat
                </button>

                <button
                  type="button"
                  onClick={() => deleteRequest(request.id)}
                  disabled={deletingId === request.id}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "10px",
                    background:
                      deletingId === request.id ? "#94a3b8" : "#dc2626",
                    color: "white",
                    fontWeight: "700",
                    cursor:
                      deletingId === request.id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === request.id
                    ? "Deleting..."
                    : "🗑️ Delete Request"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// =========================================
// SUMMARY CARD
// =========================================

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "18px",
        boxShadow:
          "0 5px 20px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: "5px 0 0",
          fontSize: "30px",
          color: "#172554",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

// =========================================
// CHAT INFO BOX
// =========================================

function ChatInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#eff6ff",
        padding: "10px 12px",
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: "700",
          color: "#1e3a8a",
          fontSize: "13px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =========================================
// INFO BOX
// =========================================

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        padding: "12px",
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: "700",
          color: "#334155",
        }}
      >
        {value}
      </div>
    </div>
  );
}