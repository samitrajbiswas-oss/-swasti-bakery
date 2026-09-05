"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Chat = {
  conversationId: string;
  requestId: string;
  customerName: string;
  cakeSize: string;
  flavor: string;
  design: string;
  requiredDate: string;
  preferredTime: string;
  fulfillment: string;
  status: string;
  latestMessage: {
    id: string;
    senderType: string;
    message: string;
    createdAt: string;
  } | null;
  unread: boolean;
  updatedAt: string;
};

export default function MyChatsPage() {
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = await user.getIdToken();

        const response = await fetch("/api/my-chats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load your chats."
          );
        }

        setChats(data.chats ?? []);
      } catch (error) {
        console.error("My chats error:", error);
        setError("Unable to load your chats. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openChat = (requestId: string) => {
    router.push(`/chat?requestId=${requestId}`);
  };

  return (
    <main className="min-h-screen bg-[#fffafa] px-5 py-8 text-[#172033]">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d94f83]">
              Swasti Bakery
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              My Chats
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#737b8c]">
              Your cake requests and conversations with The Baker.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="shrink-0 rounded-full border border-[#e5d4dc] bg-white px-4 py-2.5 text-xs font-bold text-[#687083] transition hover:border-[#d94f83] hover:text-[#c83d70]"
          >
            ← Back
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-3xl border border-[#f0dce3] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#f2dce4] border-t-[#d94f83]" />

            <p className="mt-4 text-sm font-semibold text-[#737b8c]">
              Loading your chats...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-[#172033] px-5 py-2.5 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && chats.length === 0 && (
          <div className="mt-8 rounded-3xl border border-[#f0dce3] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f5] text-2xl">
              💬
            </div>

            <h2 className="mt-5 text-xl font-black">
              No chats yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#737b8c]">
              Once you submit a cake request, your private conversation
              with The Baker will appear here.
            </p>

            <button
              type="button"
              onClick={() => router.push("/customize")}
              className="mt-5 rounded-full bg-[#d94f83] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#d94f83]/20 transition hover:bg-[#c83d70]"
            >
              Create a Cake Request
            </button>
          </div>
        )}

        {/* CHAT LIST */}
        {!loading && !error && chats.length > 0 && (
          <div className="mt-8 space-y-4">
            {chats.map((chat) => (
              <button
                key={chat.conversationId}
                type="button"
                onClick={() => openChat(chat.requestId)}
                className="group w-full rounded-3xl border border-[#f0dce3] bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#d94f83] hover:shadow-lg sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-[#172033]">
                        {chat.cakeSize} • {chat.flavor}
                      </h2>

                      {chat.unread && (
                        <span className="rounded-full bg-[#d94f83] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                          Unread
                        </span>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#737b8c]">
                      {chat.design}
                    </p>
                  </div>

                  <span className="shrink-0 text-lg text-[#d94f83] transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#f3e5ea] pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#9aa1ae]">
                      Required
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#172033]">
                      {formatDate(chat.requiredDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#9aa1ae]">
                      Time
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#172033]">
                      {chat.preferredTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#9aa1ae]">
                      Status
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#c83d70]">
                      {chat.status}
                    </p>
                  </div>
                </div>

                {chat.latestMessage && (
                  <div className="mt-4 rounded-2xl bg-[#fff7f9] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#c83d70]">
                        {chat.latestMessage.senderType === "ADMIN"
                          ? "The Baker"
                          : "You"}
                      </p>

                      <p className="text-[10px] text-[#9aa1ae]">
                        {formatDate(chat.latestMessage.createdAt)}
                      </p>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#687083]">
                      {chat.latestMessage.message}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}