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
  Users,
  BookOpen,
  MessageCircleMore,
} from "lucide-react";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();

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

  const [user, setUser] = useState<any>(
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
      icon: (
        <Users
          size={22}
          strokeWidth={2.2}
        />
      ),
      value: "0",
      text: "users online right now",
    },
    {
      icon: (
        <BookOpen
          size={22}
          strokeWidth={2.2}
        />
      ),
      value: "0",
      text: "topics viewed in the last hour",
    },
    {
      icon: (
        <MessageCircleMore
          size={22}
          strokeWidth={2.2}
        />
      ),
      value: "0",
      text: "questions viewed in the last hour",
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

          if (currentUser) {
            try {
              await updateDoc(
                doc(db, "analytics", "live"),
                {
                  usersOnline: increment(1),
                }
              );
            } catch {
              await setDoc(
                doc(db, "analytics", "live"),
                {
                  usersOnline: 1,
                  topicsViewedHour: 0,
                  questionsViewedHour: 0,
                }
              );
            }
          }
        }
      );

    return () => unsubscribe();
  }, []);

  /* =========================
     LIVE ANALYTICS
  ========================= */

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "analytics", "live"),
      (snapshot) => {
        const data = snapshot.data();

        if (!data) return;

        setStats([
          {
            icon: (
              <Users
                size={22}
                strokeWidth={2.2}
              />
            ),
            value: String(
              data.usersOnline || 0
            ),
            text: "users online right now",
          },
          {
            icon: (
              <BookOpen
                size={22}
                strokeWidth={2.2}
              />
            ),
            value: String(
              data.topicsViewedHour || 0
            ),
            text:
              "topics viewed in the last hour",
          },
          {
            icon: (
              <MessageCircleMore
                size={22}
                strokeWidth={2.2}
              />
            ),
            value: String(
              data.questionsViewedHour || 0
            ),
            text:
              "questions viewed in the last hour",
          },
        ]);
      }
    );

    return () => unsub();
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
      try {
        await updateDoc(
          doc(db, "analytics", "live"),
          {
            usersOnline:
              increment(-1),
          }
        );
      } catch (error) {
        console.error(error);
      }

      await signOut(auth);
    };

  /* =========================
     FUNCTION CLICK
  ========================= */

  const handleFunctionClick =
    async (code: string) => {
      if (!user) {
        setShowAuth(true);
        return;
      }

      try {
        await updateDoc(
          doc(db, "analytics", "live"),
          {
            topicsViewedHour:
              increment(1),
          }
        );
      } catch (error) {
        console.error(error);
      }

      router.push(
        `/topics/${selectedClass}/${code.toLowerCase()}`
      );
    };

  return (
    <>
      <main className="min-h-screen bg-[#f5f5f5] text-black pb-28">

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
                <div className="flex items-center gap-2 max-w-full">

                  <div className="bg-gray-100 px-4 py-2 rounded-2xl max-w-[140px] min-w-0">

                    <p className="text-xs text-gray-500">
                      Signed in
                    </p>

                    <p className="text-sm font-medium truncate max-w-[90px]">
                      {user.email}
                    </p>

                  </div>

                  <button
                    onClick={
                      handleLogout
                    }
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
              LIVE STATS
          ========================= */}

          <div className="mb-6 overflow-hidden">

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

                          {item.icon}

                        </div>

                        <div>

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
                  <button
                    key={index}
                    onClick={() =>
                      handleFunctionClick(
                        item.code
                      )
                    }
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-left"
                  >

                    <div className="inline-block bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-3">

                      {item.code}

                    </div>

                    <div className="mb-3">

                      <Folder
                        size={32}
                        strokeWidth={
                          1.8
                        }
                      />

                    </div>

                    <h3 className="text-lg font-bold mb-1">
                      {item.title}
                    </h3>

                    <p className="text-gray-500 text-xs leading-5">
                      {item.desc}
                    </p>

                  </button>
                )
              )}

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