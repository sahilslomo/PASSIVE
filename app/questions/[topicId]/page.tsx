"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import {
  ArrowLeft,
  Sailboat,
  Home,
  Bookmark,
  Filter,
  CircleHelp,
} from "lucide-react";
import { db } from "@/lib/firebase";
import LoadingScreen from "@/components/LoadingScreen";

type Label = {
  type: "city" | "tag";
  value: string;
};

type Question = {
  id?: string;
  question?: string;
  q?: string;
  answer?: string;
  a?: string;
  labels?: Label[];
};

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();

  const topicId = params.topicId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH QUESTIONS
  ========================= */
  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "questions"));

      const data = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
        .filter((item: any) => item.topicId === topicId);

      setQuestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [topicId]);

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
              onClick={() => router.back()}
              className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="w-12 h-12 flex items-center justify-center rotate-[-8deg]">
              <Sailboat size={30} className="text-black" />
            </div>
          </div>

          <h1 className="text-3xl font-bold">Questions</h1>
          <p className="text-gray-500 mt-2">Browse topic questions</p>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-4">
          {questions.map((item, index) => (
            <div
              key={item.id || index}
              className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex gap-4">

                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <CircleHelp size={22} />
                </div>

                <div className="w-full">

                  <p className="font-semibold mb-2">
                    Question {index + 1}
                  </p>

                  {/* QUESTION */}
                  <p className="text-gray-700 leading-7">
                    {item.question || item.q}
                  </p>

                  {/* ANSWER (FIXED) */}
                  {(item.answer || item.a) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border text-gray-800">
                      <span className="font-semibold">Answer: </span>
                      {item.answer || item.a}
                    </div>
                  )}

                  {/* LABELS SAFE */}
                  {item.labels?.length ? (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {item.labels.map((l, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-full text-white ${
                            l.type === "city"
                              ? "bg-blue-500"
                              : "bg-green-600"
                          }`}
                        >
                          {l.value}
                        </span>
                      ))}
                    </div>
                  ) : null}

                </div>
              </div>
            </div>
          ))}

          {/* EMPTY STATE */}
          {questions.length === 0 && (
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
            onClick={() => router.push("/")}
            className="flex flex-col items-center text-gray-500"
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>

          <button className="flex flex-col items-center text-gray-500">
            <Filter size={24} />
            <span className="text-xs mt-1">Filter</span>
          </button>

          <button className="flex flex-col items-center text-gray-500">
            <Bookmark size={24} />
            <span className="text-xs mt-1">Bookmarks</span>
          </button>

        </div>
      </nav>
    </main>
  );
}