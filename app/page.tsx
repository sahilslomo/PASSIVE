"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  Home,
  Filter,
  Bookmark,
  Folder,
  User,
  Lock,
  Sailboat,
  X,
  Mail,
  LogOut,
  Users,
  BookOpen,
  MessageCircleMore,
  Bot,
} from "lucide-react";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth, rtdb } from "@/lib/firebase";

import type { User as FirebaseUser }
  from "firebase/auth";

import {
  ref,
  set,
  get,
  onDisconnect,
  remove,
} from "firebase/database";

import { getToday } from "@/lib/getToday";

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
    desc:
      "EARTH FAULT, ICCP, ETC",
  },
  {
    code: "FN6",
    title: "MEP",
    desc: "MAC, STP, FWG, ETC",
  },
];

export default function HomePage() {

  /* =========================
     STATES
  ========================= */

  const [showAuth, setShowAuth] =
    useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [isSignup, setIsSignup] =
    useState(false);

  const [user, setUser] =
    useState<FirebaseUser | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [selectedClass, setSelectedClass] =
    useState("class2");

  const [activeStat, setActiveStat] =
    useState(0);

  const [stats, setStats] = useState([
    {
      type: "users",
      value: "0",
      text: "users online",
    },
    {
      type: "topics",
      value: "0",
      text: "topics viewed",
    },
    {
      type: "questions",
      value: "0",
      text: "questions viewed",
    },
  ]);

  /* =========================
    AUTH STATE
 ========================= */
  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          setUser(currentUser);

          if (!currentUser) return;

          const today = getToday();

          await set(
            ref(
              rtdb,
              `analytics/${today}/users/${currentUser.uid}`
            ),
            true
          );

          const userStatusRef = ref(
            rtdb,
            `onlineUsers/${currentUser.uid}`
          );

          await set(userStatusRef, {
            online: true,
            email: currentUser.email,
            lastSeen: Date.now(),
          });

          onDisconnect(
            userStatusRef
          ).remove();
        }
      );

    return () => unsubscribe();

  }, []);

  /* =========================
     LIVE ANALYTICS
  ========================= */

  useEffect(() => {

    const loadUsers = async () => {

      const snapshot =
        await get(
          ref(rtdb, "onlineUsers")
        );

      const data = snapshot.val();

      const totalUsers =
        data
          ? Object.keys(data).length
          : 0;

      setStats((prev) => [

        {
          type: "users",
          value: String(totalUsers),
          text: "users online",
        },

        prev[1],

        prev[2],

      ]);
    };

    loadUsers();

  }, []);

  useEffect(() => {

    const loadAnalytics = async () => {

      const today = getToday();

      const analyticsSnap = await get(
        ref(rtdb, `analytics/${today}`)
      );

      console.log(
        "ANALYTICS DATA",
        analyticsSnap.val()
      );

      const analytics =
        analyticsSnap.val() || {};

      const usersCount =
        analytics.users
          ? Object.keys(analytics.users).length
          : 0;

      const topicsCount =
        analytics.topics
          ? Object.keys(analytics.topics).length
          : 0;

      const questionsCount =
        analytics.questions
          ? Object.keys(analytics.questions).length
          : 0;

      setStats([
        {
          type: "users",
          value: String(usersCount),
          text: "users online",
        },
        {
          type: "topics",
          value: String(topicsCount),
          text: "topics viewed",
        },
        {
          type: "questions",
          value: String(questionsCount),
          text: "questions viewed",
        },
      ]);
    };

    loadAnalytics();

  }, []);

  /* =========================
     AUTO SLIDER
  ========================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStat((prev) =>
        prev === stats.length - 1
          ? 0
          : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [stats.length]);


  /* =========================
     GOOGLE LOGIN
  ========================= */

  const handleGoogleLogin =
    async () => {
      try {
        setLoading(true);

        const provider =
          new GoogleAuthProvider();

        await signInWithPopup(
          auth,
          provider
        );

        setShowAuth(false);

      } catch (error) {
        console.error(error);

        alert(
          "Google Login Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================
     EMAIL AUTH
  ========================= */

  const handleEmailAuth =
    async () => {
      if (!email || !password) {
        alert(
          "Please fill all fields"
        );
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
          error.code ===
          "auth/email-already-in-use"
        ) {
          alert(
            "Email already registered"
          );
        } else if (
          error.code ===
          "auth/invalid-credential"
        ) {
          alert(
            "Invalid email or password"
          );
        } else if (
          error.code ===
          "auth/weak-password"
        ) {
          alert(
            "Password should be at least 6 characters"
          );
        } else {
          alert(
            "Authentication Failed"
          );
        }
      } finally {
        setLoading(false);
      }
    };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout =
    async () => {

      if (auth.currentUser) {

        const userStatusRef = ref(
          rtdb,
          `onlineUsers/${auth.currentUser.uid}`
        );

        await remove(userStatusRef);
      }

      await signOut(auth);
    };

  return (
    <>
      <main className="min-h-screen bg-[#f5f5f5] text-black pb-[120px]">

        <div className="max-w-md mx-auto px-5 pt-5">

          {/* =========================
              HEADER
          ========================= */}

          <div className="bg-white border border-gray-200 rounded-3xl p-4 mb-5 shadow-sm">

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
                    Sail towards CoC
                  </p>

                </div>

              </div>

              {/* USER */}

              {user ? (

                <div className="flex items-center gap-2 flex-shrink-0">

                  <div className="bg-gray-100 px-4 py-2 rounded-2xl max-w-[110px] min-w-0">

                    <p className="text-xs text-gray-500">
                      Signed in
                    </p>

                    <p className="text-sm font-medium truncate max-w-[65px]">
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
                  onClick={() =>
                    setShowAuth(true)
                  }
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

          <div className="mb-8">

            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value
                )
              }
              className="w-full bg-white border border-gray-300 rounded-2xl px-4 py-4 text-[16px] outline-none shadow-sm"
            >

              <option value="class2">
                MEO CLASS 2
              </option>

              <option value="class4">
                MEO CLASS 4
              </option>

            </select>

          </div>

          {/* =========================
              FUNCTIONS
          ========================= */}

          <div>

            <h2 className="text-sm font-bold tracking-[2px] text-gray-500 mb-4">
              BROWSE BY FUNCTION
            </h2>

            <div className="grid grid-cols-2 gap-3">

              {functions.map(
                (item, index) => (
                  <Link
                    key={index}
                    href={`/topics/${selectedClass}/${item.code.toLowerCase()}`}
                    prefetch={false}
                    onClick={(e) => {

                      if (!auth.currentUser) {

                        e.preventDefault();

                        setShowAuth(true);

                        return;
                      }

                    }}
                    className="
bg-white
rounded-2xl
border
border-gray-200
p-4
shadow-sm
text-left
transition-all
duration-150
block

hover:shadow-md
hover:-translate-y-1

active:scale-95
active:shadow-inner
active:translate-y-[2px]
"
                  >

                    <div className="inline-block bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-3">

                      {item.code}

                    </div>

                    <div className="mb-3">

                      <Folder
                        size={32}
                        strokeWidth={1.8}
                      />

                    </div>

                    <h3 className="text-lg font-bold mb-1">
                      {item.title}
                    </h3>

                    <p className="text-gray-500 text-xs leading-5">
                      {item.desc}
                    </p>

                  </Link>
                )
              )}

            </div>

          </div>

          {/* =========================
              LIVE STATS
          ========================= */}

          <div className="mt-8 overflow-hidden">

            <div className="relative h-[92px] overflow-hidden">

              {stats.map(
                (item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ease-out ${activeStat === index
                      ? "opacity-100 translate-y-0 blur-0 scale-100 z-10"
                      : "opacity-0 translate-y-2 blur-sm scale-[0.98] pointer-events-none z-0"
                      }`}
                  >

                    <div className="bg-white border border-gray-200 rounded-3xl px-5 py-4 flex items-center justify-between shadow-sm">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-black">

                          {item.type === "users" && (
                            <Users
                              size={22}
                              strokeWidth={2.2}
                            />
                          )}

                          {item.type === "topics" && (
                            <BookOpen
                              size={22}
                              strokeWidth={2.2}
                            />
                          )}

                          {item.type === "questions" && (
                            <MessageCircleMore
                              size={22}
                              strokeWidth={2.2}
                            />
                          )}
                        </div>

                        <div className="h-[44px] flex flex-col justify-center">

                          <p className="text-[22px] font-bold text-black leading-none">
                            {item.value}
                          </p>

                          <div className="flex items-center gap-2 mt-1">

                            {activeStat === 0 && (
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.9)] animate-pulse" />
                            )}

                            <p className="text-sm text-gray-600">
                              {item.text}
                            </p>

                          </div>

                        </div>

                      </div>

                      <div className="flex gap-1.5">

                        {stats.map(
                          (
                            _,
                            dotIndex
                          ) => (
                            <div
                              key={
                                dotIndex
                              }
                              className={`w-2 h-2 rounded-full transition-all ${activeStat ===
                                dotIndex
                                ? "bg-black"
                                : "bg-gray-300"
                                }`}
                            />
                          )
                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>



        </div>


        {/* =========================
    BOTTOM NAV
======================== */}

        <nav className="fixed bottom-0 left-0 z-50 w-full bg-white border-t border-gray-200 shadow-sm backdrop-blur-lg">

          <div className="max-w-md mx-auto flex items-center justify-around py-3">

            {/* HOME */}

            <button className="flex flex-col items-center text-black font-semibold active:scale-95 transition-all duration-150">

              <Home size={22} />

              <span className="text-xs mt-1">
                Home
              </span>

            </button>

            {/* FILTER LOCKED */}

            <button
              onClick={() =>
                alert(
                  "Filter available inside Questions Page"
                )
              }
              className="flex flex-col items-center text-gray-400 relative active:scale-95 transition-all duration-150"
            >

              <div className="relative">

                <Filter size={22} />

                <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">

                  <Lock size={8} />

                </div>

              </div>

              <span className="text-xs mt-1">
                Filter
              </span>

            </button>

            {/* BOOKMARK LOCKED */}

            <button
              onClick={() =>
                alert(
                  "Bookmarks available inside Questions Page"
                )
              }
              className="flex flex-col items-center text-gray-400 relative active:scale-95 transition-all duration-150"
            >

              <div className="relative">

                <Bookmark size={22} />

                <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">

                  <Lock size={8} />

                </div>

              </div>

              <span className="text-xs mt-1">
                Bookmarks
              </span>

            </button>

            {/* REVISION */}

            <button
              onClick={() =>
                alert(
                  "Revision available inside Questions Page"
                )
              }
              className="flex flex-col items-center text-gray-400 relative active:scale-95 transition-all duration-150"
            >

              <div className="relative">

                <BookOpen size={22} />

                <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">

                  <Lock size={8} />

                </div>

              </div>

              <span className="text-xs mt-1">
                Revision
              </span>

            </button>

            {/* AI CHAT */}

            <button
              onClick={() =>
                alert(
                  "Revision available inside Questions Page"
                )
              }
              className="flex flex-col items-center text-gray-400 relative active:scale-95 transition-all duration-150"
            >

              <div className="relative">

                <Bot size={22} />

                <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">

                  <Lock size={8} />

                </div>

              </div>

              <span className="text-xs mt-1">
                Navik Bro
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
                onClick={() =>
                  setShowAuth(false)
                }
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >

                <X size={20} />

              </button>

            </div>

            {/* GOOGLE */}

            <button
              onClick={
                handleGoogleLogin
              }
              disabled={loading}
              className="w-full border border-gray-300 rounded-2xl py-4 px-4 flex items-center justify-center gap-3 font-medium hover:bg-gray-50 transition-all mb-5"
            >

              {loading ? (
                "Please wait..."
              ) : (
                <>

                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />

                  <span>
                    Continue with
                    Google
                  </span>

                </>
              )}

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
                  setEmail(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-2xl px-4 py-4 outline-none"
              />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-2xl px-4 py-4 outline-none"
              />

            </div>

            {/* BUTTON */}

            <button
              onClick={
                handleEmailAuth
              }
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
                setIsSignup(
                  !isSignup
                )
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