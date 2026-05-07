"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  ArrowLeft,
  Sailboat,
  Home,
  Bookmark,
  Filter,
  CircleHelp,
} from "lucide-react";

import {
  db,
} from "@/lib/firebase";

import LoadingScreen from "@/components/LoadingScreen";

export default function QuestionsPage() {
  const params = useParams();

  const router = useRouter();

  const topicId =
    params.topicId as string;

  const [questions, setQuestions] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     FETCH QUESTIONS
  ========================= */

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions =
    async () => {
      try {
        setLoading(true);

        const snapshot =
          await getDocs(
            collection(
              db,
              "questions"
            )
          );

        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (item: any) =>
              item.topicId ===
              topicId
          );

        setQuestions(data);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  /* =========================
     LOADER
  ========================= */

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-28">

      <div className="max-w-md mx-auto px-5 pt-5">

        {/* HEADER */}

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm mb-8">

          <div className="flex items-center justify-between mb-6">

            <button
              onClick={() =>
                router.back()
              }
              className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="w-12 h-12 flex items-center justify-center rotate-[-8deg]">

              <Sailboat
                size={30}
                className="text-black"
              />

            </div>

          </div>

          <h1 className="text-3xl font-bold">
            Questions
          </h1>

          <p className="text-gray-500 mt-2">
            Browse topic questions
          </p>

        </div>

        {/* QUESTIONS */}

        <div className="space-y-4">

          {questions.map(
            (
              item,
              index
            ) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm"
              >

                <div className="flex gap-4">

                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">

                    <CircleHelp size={22} />

                  </div>

                  <div>

                    <p className="font-semibold mb-2">
                      Question{" "}
                      {index + 1}
                    </p>

                    <p className="text-gray-700 leading-7">
                      {item.question}
                    </p>

                  </div>

                </div>

              </div>
            )
          )}

          {/* EMPTY STATE */}

          {questions.length ===
            0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center">

              <p className="text-gray-500">
                No questions added yet.
              </p>

            </div>
          )}

        </div>

      </div>

      {/* BOTTOM NAV */}

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-sm">

        <div className="max-w-md mx-auto flex items-center justify-around py-3">

          <button
            onClick={() =>
              router.push("/")
            }
            className="flex flex-col items-center text-gray-500"
          >

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
  );
}