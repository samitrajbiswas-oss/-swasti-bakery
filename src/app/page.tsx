"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const cakes = Array.from(
  { length: 18 },
  (_, i) => `/cake${i + 1}.jpeg`
);

const translations = {
  english: {
    languageTitle: "Choose your language",
    languageSubtitle: "Select the language you want to use on Swasti Bakery.",
    continueButton: "Continue",
    introTitle: "Swasti Bakery",
    introText:
      "Beautiful cakes, freshly baked with care. Choose a cake you love or tell us exactly what you want.",
    baker: "The Baker",
    bakerText:
      "Every cake is prepared with patience, creativity and a personal touch.",
    cakesTitle: "Our Cakes",
    cakesText: "A collection of cakes made with care.",
    customize: "Order Your Custom Cake From Here →",
    price: "Your Budget",
    request: "Tell us what you want",
    requestPlaceholder:
      "Describe the cake you would like...",
    decrease: "Decrease price",
    increase: "Increase price",
    order: "Place Order",
    language: "Language",
    freshlyBaked: "Freshly baked",
    homemadeTag: "Homemade • Fresh • Personal",
    exploreCakes: "Explore Cakes",
    creations: "18 creations",
    makeItYours: "Make it yours",
    increaseBy: "Increase by ₹50",
    budgetMinimum: "₹200 minimum • ₹2000 maximum",
    nextPageNote: "You'll enter the complete cake details on the next page.",
    footerText: "Fresh cakes, made with care.",
    authorizedOnly: "Authorized bakery management only",
    cancel: "Cancel",
    myChats: "My Chats",

    adminAccess: "Admin Access",
    adminText: "Bakery management",
    adminButton: "Admin Dashboard",
    adminKeyTitle: "Enter Admin Key",
    adminKeyPlaceholder: "Enter your secret key",
    adminEnter: "Enter Dashboard",
    adminChecking: "Checking...",
    wrongKey: "Incorrect admin key.",
  },

  bengali: {
    languageTitle: "আপনার ভাষা বেছে নিন",
    languageSubtitle: "স্বস্তি বেকারিতে আপনি যে ভাষায় ব্যবহার করতে চান সেটি বেছে নিন।",
    continueButton: "এগিয়ে যান",
    introTitle: "স্বস্তি বেকারি",
    introText:
      "ভালোবাসা ও যত্নের সঙ্গে তৈরি সুন্দর কেক। আপনার পছন্দের কেক বেছে নিন অথবা নিজের মতো করে কেকের কথা জানান।",
    baker: "The Baker",
    bakerText:
      "প্রতিটি কেক ধৈর্য, সৃজনশীলতা এবং যত্নের সঙ্গে তৈরি করা হয়।",
    cakesTitle: "আমাদের কেক",
    cakesText: "যত্নের সঙ্গে তৈরি করা কিছু কেক।",
    customize: "আপনার কাস্টম কেক এখান থেকে অর্ডার করুন →",
    price: "আপনার বাজেট",
    request: "আপনার পছন্দ জানান",
    requestPlaceholder:
      "আপনি কেমন কেক চান তা লিখুন...",
    decrease: "দাম কমান",
    increase: "দাম বাড়ান",
    order: "অর্ডার করুন",
    language: "ভাষা",
    freshlyBaked: "তাজা করে তৈরি",
    homemadeTag: "ঘরোয়া • তাজা • ব্যক্তিগত",
    exploreCakes: "কেক দেখুন",
    creations: "১৮টি কেক",
    makeItYours: "নিজের মতো করে",
    increaseBy: "₹৫০ করে বাড়ান",
    budgetMinimum: "সর্বনিম্ন ₹২০০ • সর্বোচ্চ ₹২০০০",
    nextPageNote: "পরের পৃষ্ঠায় কেকের সম্পূর্ণ বিবরণ দিতে পারবেন।",
    footerText: "যত্নের সঙ্গে তৈরি তাজা কেক।",
    authorizedOnly: "শুধুমাত্র অনুমোদিত বেকারি পরিচালনার জন্য",
    cancel: "বাতিল",
    myChats: "আমার চ্যাট",

    adminAccess: "অ্যাডমিন অ্যাক্সেস",
    adminText: "বেকারি পরিচালনা",
    adminButton: "অ্যাডমিন ড্যাশবোর্ড",
    adminKeyTitle: "অ্যাডমিন কী লিখুন",
    adminKeyPlaceholder: "আপনার গোপন কী লিখুন",
    adminEnter: "ড্যাশবোর্ডে প্রবেশ করুন",
    adminChecking: "যাচাই হচ্ছে...",
    wrongKey: "ভুল অ্যাডমিন কী।",
  },

  hindi: {
    languageTitle: "अपनी भाषा चुनें",
    languageSubtitle: "स्वस्ति बेकरी पर आप जिस भाषा में उपयोग करना चाहते हैं, उसे चुनें।",
    continueButton: "जारी रखें",
    introTitle: "स्वस्ति बेकरी",
    introText:
      "प्यार और देखभाल से बनाए गए खूबसूरत केक। अपना पसंदीदा केक चुनें या अपनी पसंद के अनुसार केक के बारे में बताएं।",
    baker: "The Baker",
    bakerText:
      "हर केक धैर्य, रचनात्मकता और व्यक्तिगत देखभाल के साथ बनाया जाता है।",
    cakesTitle: "हमारे केक",
    cakesText: "देखभाल के साथ बनाए गए कुछ केक।",
    customize: "अपना कस्टम केक यहाँ ऑर्डर करें →",
    price: "आपका बजट",
    request: "अपनी पसंद बताएं",
    requestPlaceholder:
      "आप कैसा केक चाहते हैं, लिखें...",
    decrease: "कीमत कम करें",
    increase: "कीमत बढ़ाएं",
    order: "ऑर्डर करें",
    language: "भाषा",
    freshlyBaked: "ताज़ा बेक किया हुआ",
    homemadeTag: "घर का • ताज़ा • व्यक्तिगत",
    exploreCakes: "केक देखें",
    creations: "18 केक",
    makeItYours: "अपनी पसंद का बनाएं",
    increaseBy: "₹50 बढ़ाएं",
    budgetMinimum: "न्यूनतम ₹200 • अधिकतम ₹2000",
    nextPageNote: "अगले पेज पर आप केक की पूरी जानकारी देंगे।",
    footerText: "देखभाल से बनाए गए ताज़ा केक।",
    authorizedOnly: "केवल अधिकृत बेकरी प्रबंधन के लिए",
    cancel: "रद्द करें",
    myChats: "मेरी चैट",

    adminAccess: "एडमिन एक्सेस",
    adminText: "बेकरी प्रबंधन",
    adminButton: "एडमिन डैशबोर्ड",
    adminKeyTitle: "एडमिन की दर्ज करें",
    adminKeyPlaceholder: "अपनी गुप्त की दर्ज करें",
    adminEnter: "डैशबोर्ड में प्रवेश करें",
    adminChecking: "जांच हो रही है...",
    wrongKey: "गलत एडमिन की।",
  },
};

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] =
    useState<keyof typeof translations | null>(null);

  const [languageReady, setLanguageReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [request, setRequest] = useState("");

  // ADMIN ACCESS
  const [showAdminLogin, setShowAdminLogin] =
    useState(false);

  const [adminKey, setAdminKey] = useState("");
  const [adminError, setAdminError] = useState("");
  const [checkingAdmin, setCheckingAdmin] =
    useState(false);

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);

      if (!user) {
        // Google authentication is required before entering the bakery.
        router.replace("/login");
        return;
      }

      // Remember the language separately for each signed-in user on this browser.
      const storageKey = `swasti_language_${user.uid}`;
      const savedLanguage = window.localStorage.getItem(storageKey);

      if (
        savedLanguage === "english" ||
        savedLanguage === "bengali" ||
        savedLanguage === "hindi"
      ) {
        setLanguage(savedLanguage);
        setLanguageReady(true);
      } else {
        setLanguage(null);
        setLanguageReady(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Check this customer's private chats for unread replies from The Baker.
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadUnreadChats = async (user: typeof auth.currentUser) => {
      if (!user) {
        if (!cancelled) {
          setUnreadChatCount(0);
        }
        return;
      }

      try {
        const token = await user.getIdToken();

        const response = await fetch("/api/my-chats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled && data.success) {
          const count = (data.chats ?? []).filter(
            (chat: { unread: boolean }) => chat.unread
          ).length;

          setUnreadChatCount(count);
        }
      } catch (error) {
        console.error("Unread chat check error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUnreadChats(user);

        intervalId = setInterval(() => {
          loadUnreadChats(user);
        }, 30000);
      } else {
        setUnreadChatCount(0);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const handleLanguageSelect = (
    selectedLanguage: keyof typeof translations
  ) => {
    setLanguage(selectedLanguage);

    const user = auth.currentUser;
    if (user) {
      window.localStorage.setItem(
        `swasti_language_${user.uid}`,
        selectedLanguage
      );
    }

    setLanguageReady(true);
  };

  // Do not show the bakery page before authentication has been checked.
  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffafa] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f5] text-2xl">
            🌸
          </div>
          <p className="mt-4 text-sm font-bold text-[#172033]">
            Swasti Bakery
          </p>
          <p className="mt-1 text-xs text-[#8a91a0]">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  // Unauthenticated users are redirected to Google login.
  if (!auth.currentUser) {
    return null;
  }

  const activeLanguage = language ?? "english";
  const t = translations[activeLanguage];

  const goToCustomize = () => {
    window.location.href = "/customize";
  };

  // =========================================
  // ADMIN ACCESS
  // =========================================

  const openAdminAccess = () => {
    setShowAdminLogin(true);
    setAdminError("");
  };

  const closeAdminAccess = () => {
    setShowAdminLogin(false);
    setAdminKey("");
    setAdminError("");
  };

  const handleAdminAccess = async () => {
    if (!adminKey.trim()) {
      setAdminError(
        "Please enter the admin key."
      );
      return;
    }

    try {
      setCheckingAdmin(true);
      setAdminError("");

      const response = await fetch(
        "/api/admin/auth",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          // IMPORTANT:
          // Allows the browser to receive/store
          // the HttpOnly authentication cookie.
          credentials: "include",

          body: JSON.stringify({
            key: adminKey.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAdminError(t.wrongKey);
        return;
      }

      // IMPORTANT:
      // Do NOT save the admin key in
      // sessionStorage or localStorage.
      //
      // The server has created the secure
      // HttpOnly cookie for us.

      window.location.href = "/admin";
    } catch (error) {
      console.error(
        "Admin access error:",
        error
      );

      setAdminError(
        "Unable to verify admin key. Please try again."
      );
    } finally {
      setCheckingAdmin(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#fffafa] text-[#172033]">

      {/* =========================================
          HEADER
      ========================================= */}

      <header className="sticky top-0 z-50 border-b border-[#f3dce4] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">

          <div>
            <h1 className="text-xl font-black tracking-tight text-[#172033] sm:text-2xl">
              Swasti{" "}
              <span className="text-[#d94f83]">
                Bakery
              </span>
            </h1>

            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#7c8494]">
              Freshly baked
            </p>
          </div>

          {/* LANGUAGE */}

          <div className="flex items-center gap-2">

            <span className="hidden text-xs font-semibold text-[#7c8494] sm:block">
              {t.language}
            </span>

            <button
              type="button"
              onClick={() => router.push("/my-chats")}
              className="relative rounded-full border border-[#d94f83] bg-[#fff5f8] px-4 py-2 text-xs font-black text-[#c83d70] transition hover:bg-[#fff0f5] sm:text-sm"
            >
              💬 <span className="hidden sm:inline">{t.myChats}</span>
              <span className="sm:hidden">Chats</span>

              {unreadChatCount > 0 && (
                <span
                  aria-label={`${unreadChatCount} unread chat${
                    unreadChatCount === 1 ? "" : "s"
                  }`}
                  className="absolute -right-1 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#d94f83] px-1.5 text-[10px] font-black text-white shadow-sm"
                >
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>

            <select
              value={activeLanguage}
              onChange={(e) =>
                handleLanguageSelect(
                  e.target.value as keyof typeof translations
                )
              }
              className="rounded-full border border-[#ead3dc] bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#d94f83]"
            >
              <option value="english">
                English
              </option>

              <option value="bengali">
                বাংলা
              </option>

              <option value="hindi">
                हिन्दी
              </option>
            </select>

          </div>
        </div>
      </header>

      {/* =========================================
          HERO
      ========================================= */}

      <section className="mx-auto max-w-6xl px-5 pb-14 pt-10 sm:pt-16">

        <div className="grid items-center gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px]">

          {/* INTRO */}

          <div className="order-2 md:order-1">

            <div className="mb-5 inline-flex rounded-full border border-[#f1cbd8] bg-[#fff0f5] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c83d70]">
              Homemade • Fresh • Personal
            </div>

            <h2 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight text-[#172033] sm:text-6xl lg:text-7xl">
              {t.introTitle}
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#687083] sm:text-lg">
              {t.introText}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">

              <a
                href="#cakes"
                className="rounded-full bg-[#172033] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#26324a]"
              >
                Explore Cakes
              </a>

              <button
                type="button"
                onClick={goToCustomize}
                className="rounded-full bg-[#d94f83] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#d94f83]/25 transition duration-300 hover:-translate-y-1 hover:bg-[#c83d70] hover:shadow-xl active:translate-y-0"
              >
                {t.customize}
              </button>

            </div>
          </div>

          {/* BAKER */}

          <div className="order-1 md:order-2">

            <div className="relative overflow-hidden rounded-[2rem] border border-[#f0d7df] bg-white p-3 shadow-[0_20px_60px_rgba(90,40,60,0.10)]">

              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f8e9ee]">

                <Image
                  src="/mom.jpeg"
                  alt="The Baker"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 340px"
                />

              </div>

              <div className="px-3 pb-3 pt-4">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d94f83]">
                  {t.baker}
                </p>

                <h3 className="mt-1 text-xl font-black text-[#172033]">
                  Simpal Nandi Biswas
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#687083]">
                  {t.bakerText}
                </p>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================
          CAKES
      ========================================= */}

      <section
        id="cakes"
        className="border-y border-[#f2dfe5] bg-white px-5 py-14 sm:py-20"
      >

        <div className="mx-auto max-w-6xl">

          <div className="mb-8 flex items-end justify-between gap-5">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d94f83]">
                Freshly baked
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {t.cakesTitle}
              </h2>

              <p className="mt-2 text-sm text-[#737b8c]">
                {t.cakesText}
              </p>

            </div>

            <div className="hidden rounded-full bg-[#fff0f5] px-4 py-2 text-xs font-bold text-[#c83d70] sm:block">
              18 creations
            </div>

          </div>

          {/* CAKE GRID */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

            {cakes.map((cake) => (

              <div
                key={cake}
                className="group overflow-hidden rounded-2xl border border-[#f0e1e6] bg-[#fffafa] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="relative aspect-square overflow-hidden">

                  <Image
                    src={cake}
                    alt="Freshly baked cake"
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                </div>

              </div>

            ))}

          </div>

        </div>
      </section>

      {/* =========================================
          FOOTER
      ========================================= */}

      <footer className="border-t border-[#f0dce3] bg-white px-5 py-10">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <p className="text-sm font-bold text-[#172033]">
              Swasti Bakery
            </p>

            <p className="mt-1 text-xs text-[#8a91a0]">
              Fresh cakes, made with care.
            </p>

          </div>

          {/* =====================================
              ADMIN ACCESS
          ===================================== */}

          <div className="mx-auto mt-8 max-w-sm">

            {!showAdminLogin ? (

              <div className="rounded-2xl border border-[#e8dce2] bg-[#fffafa] p-5 text-center">

                <div className="text-2xl">
                  🔐
                </div>

                <h3 className="mt-2 text-sm font-black text-[#172033]">
                  {t.adminAccess}
                </h3>

                <p className="mt-1 text-xs text-[#8a91a0]">
                  {t.adminText}
                </p>

                <button
                  type="button"
                  onClick={openAdminAccess}
                  className="mt-4 rounded-full border border-[#d94f83] bg-white px-5 py-2.5 text-xs font-bold text-[#c83d70] transition hover:bg-[#fff0f5]"
                >
                  {t.adminButton}
                </button>

              </div>

            ) : (

              <div className="rounded-2xl border border-[#efd7df] bg-[#fffafa] p-5 shadow-sm">

                <div className="text-center">

                  <div className="text-2xl">
                    🔑
                  </div>

                  <h3 className="mt-2 text-base font-black text-[#172033]">
                    {t.adminKeyTitle}
                  </h3>

                  <p className="mt-1 text-xs text-[#8a91a0]">
                    Authorized bakery management only
                  </p>

                </div>

                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => {
                    setAdminKey(e.target.value);
                    setAdminError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminAccess();
                    }
                  }}
                  placeholder={t.adminKeyPlaceholder}
                  autoComplete="off"
                  className="mt-4 w-full rounded-xl border border-[#e5d4dc] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d94f83] focus:ring-2 focus:ring-[#f5d6e1]"
                />

                {adminError && (
                  <p className="mt-2 text-center text-xs font-semibold text-red-600">
                    {adminError}
                  </p>
                )}

                <div className="mt-4 flex gap-2">

                  <button
                    type="button"
                    onClick={closeAdminAccess}
                    className="flex-1 rounded-full border border-[#e5d4dc] bg-white px-4 py-3 text-xs font-bold text-[#687083] transition hover:border-[#d94f83]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminAccess}
                    disabled={checkingAdmin}
                    className="flex-1 rounded-full bg-[#172033] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#26324a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkingAdmin
                      ? t.adminChecking
                      : t.adminEnter}
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>
      </footer>

    </main>

      {authChecked && !languageReady && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172033]/70 px-5 py-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_100px_rgba(20,25,45,0.28)] sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#d94f83]">
              <span className="text-2xl">🌸</span>
            </div>

            <div className="mt-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d94f83]">
                Swasti Bakery
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#172033] sm:text-3xl">
                Choose your language
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#737b8c]">
                Select the language you want to use on Swasti Bakery.
              </p>
            </div>

            <div className="mt-7 grid gap-3">
              {(
                [
                  ["english", "English", "English"],
                  ["bengali", "বাংলা", "বাংলা"],
                  ["hindi", "हिन्दी", "हिन्दी"],
                ] as const
              ).map(([value, nativeName, englishName]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleLanguageSelect(value)}
                  className="group flex min-h-14 items-center justify-between rounded-2xl border border-[#ead8df] bg-[#fffafa] px-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#d94f83] hover:bg-[#fff5f8] hover:shadow-md active:scale-[0.99]"
                >
                  <div>
                    <p className="text-base font-black text-[#172033]">
                      {nativeName}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#8a91a0]">
                      {englishName}
                    </p>
                  </div>

                  <span className="text-lg text-[#d94f83] transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              ))}
            </div>


          </div>
        </div>
      )}
    </>
  );
}