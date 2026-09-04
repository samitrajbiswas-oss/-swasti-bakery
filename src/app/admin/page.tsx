"use client";

import { useEffect, useState } from "react";

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