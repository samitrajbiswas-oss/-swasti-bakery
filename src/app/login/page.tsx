"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed. Please try again.");
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        {/* Bakery Icon */}
        <div className="bakery-icon">🥐</div>

        {/* Brand */}
        <h1>BakeryPro</h1>

        <p className="welcome">
          Welcome back!
        </p>

        <p className="subtitle">
          Sign in to continue to your bakery dashboard
        </p>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="google-button"
        >
          <span className="google-logo">G</span>
          <span>Continue with Google</span>
        </button>

        <div className="divider">
          <span>Secure login</span>
        </div>

        <p className="footer-text">
          Fresh ideas. Better baking. 🍰
        </p>
      </div>
    </main>
  );
}