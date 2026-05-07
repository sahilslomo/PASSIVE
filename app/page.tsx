"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Home,
  Filter,
  Bookmark,
  Folder,
  User,
  Sailboat,
  X,
  Mail,
  LogOut,
} from "lucide-react";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();

  /* =========================
     STATES
  ========================= */

  const [showAuth, setShowAuth] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSignup, setIsSignup] = useState(false);

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [selectedClass, setSelectedClass] =
    useState("class2");

  /* =========================
     AUTH STATE
  ========================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================
     FUNCTIONS DATA
  ========================= */

  const functions = [
    {
      code: "FN3",
      title: "SAFETY",
      desc: "IMO, MLC, UNCLOS, ETC",
    },
    {
      code: "FN4B",
      title: "MOTOR",
      desc: "PISTON, LINER, ETC",
    },
    {
      code: "FN5",
      title: "ELECTRICAL",
      desc: "EARTH FAULT, ICCP, ETC",
    },
    {
      code: "FN6",
      title: "MEP",
      desc: "MAC, STP, FWG, ETC",
    },
  ];

  /* =========================
     GOOGLE LOGIN
  ========================= */

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      setShowAuth(false);

    } catch (error) {
      console.error(error);
      alert("Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EMAIL AUTH
  ========================= */

  const handleEmailAuth = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      if (isSignup) {
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      setShowAuth(false);

      setEmail("");
      setPassword("");

    } catch (error: any) {
      console.error(error);

      if (
        error.code === "auth/email-already-in-use"
      ) {
        alert("Email already registered");
      } else if (
        error.code === "auth/invalid-credential"
      ) {
        alert("Invalid email or password");
      } else if (
        error.code === "auth/weak-password"
      ) {
        alert(
          "Password should be at least 6 characters"
        );
      } else {
        alert("Authentication Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      <main className="min-h-screen bg-[#f5f5f5] text-black pb-28">

        <div className="max-w-md mx-auto px-5 pt-5">

          {/* =========================
              HEADER
          ========================= */}

          <div className="bg-white border border-gray-200 rounded-3xl p-4 mb-8 shadow-sm">

            <div className="flex items-center justify-between">

              {/* LOGO */}
              <div className="flex items-center gap-3">

                <div className="w-14 h-14 flex items-center justify-center rotate-[-8deg]">
                  <Sailboat
                    size={34}
                    strokeWidth={2}
                    className="text-black"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    NAVIK
                  </h1>

                  <p className="text-sm text-gray-500">
                    MMD Oral Preparation
                  </p>
                </div>
              </div>

              {/* LOGIN / USER */}
              {user ? (
                <div className="flex items-center gap-2">

                  <div className="bg-gray-100 px-4 py-2 rounded-2xl max-w-[160px]">

                    <p className="text-xs text-gray-500">
                      Signed in
                    </p>

                    <p className="text-sm font-medium truncate max-w-[60px]">
                      {user.email}
                    </p>

                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center"
                  >
                    <LogOut size={18} />
                  </button>

                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
                >
                  <User size={16} />
                  Login
                </button>
              )}

            </div>
          </div>

          {/* =========================
              CLASS SELECTOR
          ========================= */}

          <div className="mb-10">

            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(e.target.value)
              }
              className="w-full bg-white border border-gray-300 rounded-2xl px-4 py-4 text-[16px] outline-none shadow-sm"
            >

              <option value="class2">
                Class 2 Oral Questions
              </option>

              <option value="class4">
                Class 4 Oral Questions
              </option>

            </select>

          </div>

          {/* =========================
              FUNCTIONS
          ========================= */}

          <div>

            <h2 className="text-sm font-bold tracking-[2px] text-gray-500 mb-5">
              BROWSE BY FUNCTION
            </h2>

            <div className="grid grid-cols-2 gap-5">

              {functions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {

                    /* LOGIN REQUIRED */

                    if (!user) {
                      setShowAuth(true);
                      return;
                    }

                    /* REDIRECT TO TOPICS PAGE */

                    router.push(
                      `/topics/${selectedClass}/${item.code.toLowerCase()}`
                    );
                  }}
                  className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-left"
                >

                  {/* BADGE */}
                  <div className="inline-block bg-black text-white text-sm font-bold px-4 py-2 rounded-xl mb-5">
                    {item.code}
                  </div>

                  {/* ICON */}
                  <div className="mb-4">
                    <Folder
                      size={42}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* TITLE */}
                  <h3 className="text-xl font-bold mb-2">
                    {item.title}
                  </h3>

                  {/* DESC */}
                  <p className="text-gray-500 text-sm leading-6">
                    {item.desc}
                  </p>

                </button>
              ))}

            </div>
          </div>
        </div>

        {/* =========================
            BOTTOM NAV
        ========================= */}

        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-sm">

          <div className="max-w-md mx-auto flex items-center justify-around py-3">

            <button className="flex flex-col items-center text-black font-semibold">

              <Home size={24} />

              <span className="text-xs mt-1">
                Home
              </span>

            </button>

            <button className="flex flex-col items-center text-gray-500">

              <Filter size={24} />

              <span className="text-xs mt-1">
                Filter
              </span>

            </button>

            <button className="flex flex-col items-center text-gray-500">

              <Bookmark size={24} />

              <span className="text-xs mt-1">
                Bookmarks
              </span>

            </button>

          </div>
        </nav>
      </main>

      {/* =========================
          AUTH MODAL
      ========================= */}

      {showAuth && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-5">

          <div className="w-full max-w-sm bg-white rounded-[32px] p-7 shadow-2xl">

            {/* HEADER */}
            <div className="flex items-start justify-between mb-8">

              <div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Welcome
                </h2>

                <p className="text-gray-500 text-sm mt-2 leading-6">
                  Sign in to continue accessing NAVIK.
                </p>

              </div>

              <button
                onClick={() => setShowAuth(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>

            </div>

            {/* GOOGLE */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-gray-300 rounded-2xl py-4 px-4 flex items-center justify-center gap-3 font-medium hover:bg-gray-50 transition-all mb-5"
            >

              {loading
                ? "Please wait..."
                : "Continue with Google"}

            </button>

            {/* DIVIDER */}
            <div className="flex items-center gap-4 mb-5">

              <div className="h-px bg-gray-200 flex-1" />

              <span className="text-xs text-gray-400">
                OR
              </span>

              <div className="h-px bg-gray-200 flex-1" />

            </div>

            {/* EMAIL */}
            <div className="space-y-4 mb-5">

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full border border-gray-300 rounded-2xl px-4 py-4 outline-none"
              />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full border border-gray-300 rounded-2xl px-4 py-4 outline-none"
              />

            </div>

            {/* BUTTON */}
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full bg-black text-white rounded-2xl py-4 px-4 flex items-center justify-center gap-3 font-medium"
            >

              <Mail size={18} />

              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Login with Email"}

            </button>

            {/* SWITCH */}
            <button
              onClick={() =>
                setIsSignup(!isSignup)
              }
              className="w-full mt-5 text-sm text-gray-500 hover:text-black"
            >
              {isSignup
                ? "Already have an account? Login"
                : "New here? Create account"}
            </button>

          </div>
        </div>
      )}
    </>
  );
}