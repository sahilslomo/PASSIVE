"use client";

import "@/app/admin/quill.css";
import {
  useEffect,
  useState,
  useRef,
} from "react";

import { useParams, useRouter } from "next/navigation";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  query,
  where,
  getDoc,
} from "firebase/firestore";

import {
  ArrowLeft,
  Sailboat,
  Home,
  BookOpen,
  Filter,
  Star,
  Search,
  MessageCircle,
  Bot,
} from "lucide-react";

import { db, auth, } from "@/lib/firebase";
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

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [hasAccess, setHasAccess] =
    useState(false);

  const params = useParams();
  const router = useRouter();

  const topicId =
    params.topicId as string;

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [transcripts, setTranscripts] =
    useState<any[]>([]);

  useEffect(() => {
    console.log("📦 TRANSCRIPTS UPDATED:", transcripts);
  }, [transcripts]);   // ✅ ADD HERE

  const [loading, setLoading] =
    useState(true);

  const [topicName, setTopicName] =
    useState("Topic");

  type Bookmark = {
    questionId: string;
    topicId: string;
  };

  const [bookmarks, setBookmarks] =
    useState<Bookmark[]>([]);

  const bookmarksLoaded =
    useRef(false);

  /* LOAD BOOKMARKS */

  useEffect(() => {

    const saved =
      localStorage.getItem(
        "bookmarks"
      );

    if (saved) {

      setBookmarks(
        JSON.parse(saved)
      );
    }

    bookmarksLoaded.current = true;

  }, []);

  /* SAVE BOOKMARKS */

  useEffect(() => {

    if (!bookmarksLoaded.current)
      return;

    localStorage.setItem(
      "bookmarks",
      JSON.stringify(bookmarks)
    );

  }, [bookmarks]);

  const [openAnswers, setOpenAnswers] =
    useState<string[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [
    selectedLabels,
    setSelectedLabels,
  ] = useState<string[]>([]);

  const [showFilter, setShowFilter] =
    useState(false);

  const labelOptions = [
    "MUMBAI",
    "CHENNAI",
    "KOCHI",
    "KOLKATA",
  ];

  /* =========================
     FETCH QUESTIONS + TOPIC
  ========================= */



  const fetchQuestions = async () => {

    try {

      setLoading(true);

      /* QUESTIONS */

      const questionSnapshot = await getDocs(
        query(
          collection(db, "questions"),
          where("topicId", "==", topicId)
        )
      );

      const questionData =
        questionSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

      setQuestions(questionData);

      /* TRANSCRIPTS */

      const transcriptSnapshot = await getDocs(
        query(
          collection(db, "transcripts"),
          where("topicId", "==", topicId)
        )
      );

      const transcriptData =
        transcriptSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

      console.log("TRANSCRIPTS LOADED:", transcriptData.length);

      setTranscripts(transcriptData);

      /* TOPIC */

      const topicSnapshot =
        await getDocs(
          collection(db, "topics")
        );

      const topicData =
        topicSnapshot.docs.find(
          (doc) =>
            doc.id === topicId
        );

      if (topicData) {

        setTopicName(
          (topicData.data() as any)
            .title
        );
      }

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    const unsubscribe = auth.onAuthStateChanged(
      async (user) => {

        try {

          if (!user) {

            router.replace("/");

            return;
          }

          // GET TOPIC

          const topicRef = doc(
            db,
            "topics",
            topicId
          );

          const topicSnap =
            await getDoc(topicRef);

          if (!topicSnap.exists()) {

            router.replace("/");

            return;
          }

          const topicData =
            topicSnap.data();

          const topicClass =
            topicData?.classId || "";

          // GET USER

          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userSnap =
            await getDoc(userRef);

          if (!userSnap.exists()) {

            router.replace("/");

            return;
          }

          const userData =
            userSnap.data();

          const isSubscribed =
            userData?.isSubscribed || false;

          const subscribedClasses =
            userData?.subscribedClasses || [];

          const subscriptionEndsAt =
            userData?.subscriptionEndsAt || 0;

          if (isSubscribed) {

            const subscriptionExpired =
              Date.now() > subscriptionEndsAt;

            if (subscriptionExpired) {

              alert("Your subscription expired");

              router.replace("/");

              return;
            }

            const hasClassAccess =
              subscribedClasses.includes(topicClass);

            if (!hasClassAccess) {

              alert(
                `You are subscribed to ${subscribedClasses[0]?.toUpperCase() ||
                "another class"
                } only`
              );

              router.replace("/");

              return;
            }
          }

          setHasAccess(true);

          await fetchQuestions();

        } catch (error) {

          console.error(error);

          router.replace("/");

        } finally {

          setCheckingAccess(false);

        }
      }
    );

    return () => unsubscribe();

  }, []);

  /* =========================
     ACTIONS
  ========================= */

  const toggleBookmark = (
    id: string
  ) => {

    setBookmarks((prev) => {

      const exists =
        prev.some(
          (b) =>
            b.questionId === id &&
            b.topicId === topicId
        );

      if (exists) {

        return prev.filter(
          (b) =>
            !(
              b.questionId === id &&
              b.topicId === topicId
            )
        );
      }

      return [
        ...prev,
        {
          questionId: id,
          topicId,
        },
      ];
    });
  };

  const toggleAnswer = async (
    id: string
  ) => {

    const isAlreadyOpen =
      openAnswers.includes(id);

    setOpenAnswers((prev) =>
      prev.includes(id)
        ? prev.filter(
          (x) => x !== id
        )
        : [...prev, id]
    );

    /* COUNT ONLY WHEN OPENING */

    if (!isAlreadyOpen) {
      try {

        await updateDoc(
          doc(db, "analytics", "live"),
          {
            questionsViewedHour:
              increment(1),
          }
        );

      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleLabel = (
    label: string
  ) => {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter(
          (l) => l !== label
        )
        : [...prev, label]
    );
  };

  /* =========================
     FILTER LOGIC
  ========================= */

  const filteredQuestions =
    questions.filter((q) => {
      const questionText = (
        q.question ||
        q.q ||
        ""
      ).toLowerCase();

      const answerText = (
        q.answer ||
        q.a ||
        ""
      ).toLowerCase();

      const search =
        searchText.toLowerCase();

      const matchesSearch =
        search === "" ||
        questionText.includes(search) ||
        answerText.includes(search) ||
        q.labels?.some((l) =>
          l.value.toLowerCase().includes(search)
        );

      const matchesLabel =
        selectedLabels.length ===
        0 ||
        q.labels?.some((l) =>
          selectedLabels.includes(
            l.value
          )
        );

      return (
        matchesSearch &&
        matchesLabel
      );
    });

  /* =========================
     LOADER
  ========================= */

  if (
    loading ||
    checkingAccess
  ) {
    return <LoadingScreen />;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-28 select-none">

      <div className="max-w-md mx-auto px-5 pt-5">

        {/* ================= HEADER ================= */}

        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm mb-4">

          {/* TOP */}

          <div className="flex items-center justify-between mb-6">

            <button
              onClick={() =>
                router.back()
              }
              className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>

            {/* SAME LOGO AS TOPICS PAGE */}

            <div className="w-12 h-12 flex items-center justify-center rotate-[-8deg]">

              <Sailboat
                size={30}
                strokeWidth={2}
                className="text-black"
              />

            </div>

          </div>

          {/* TITLE */}

          <div>

            <h1 className="text-3xl font-bold leading-tight">
              Questions
            </h1>

            <p className="text-gray-500 mt-2 leading-6">
              {topicName}
            </p>

            <div className="mt-5 border-l-4 border-cyan-500 pl-4">
              <p className="text-base md:text-lg font-medium italic text-gray-700 leading-7">
                “Keep Showing Up Daily —
                <span className="text-cyan-600 font-semibold">
                  {" "}Consistency Always Wins.
                </span>
              </p>
            </div>


          </div>

        </div>

        {/* ================= SEARCH ================= */}

        <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2 mb-4">

          <Search
            size={18}
            className="text-gray-500"
          />

          <input
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
            placeholder="Search questions or answers..."
            className="w-full outline-none bg-transparent"
          />

        </div>

        {/* ================= QUESTIONS ================= */}

        <div className="space-y-4">

          {filteredQuestions.map(
            (q, i) => {
              const id = q.id!;

              const isOpen =
                openAnswers.includes(
                  id
                );

              const isBookmarked =
                bookmarks.some(
                  (b) =>
                    b.questionId === id &&
                    b.topicId === topicId
                );

              return (
                <div
                  key={id}
                  className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm"
                >

                  <div className="flex justify-between gap-3 min-w-0">

                    {/* LEFT */}

                    <div
                      className="flex gap-3 w-full min-w-0 cursor-pointer"
                      onClick={() =>
                        toggleAnswer(
                          id
                        )
                      }
                    >

                      {/* QUESTION ICON */}

                      <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">

                        <MessageCircle size={22} />

                      </div>

                      {/* QUESTION */}

                      <div className="min-w-0 flex-1">

                        <p className="font-semibold text-sm">
                          Question{" "}
                          {i + 1}
                        </p>

                        <p className="text-gray-700 mt-1 leading-6">
                          {q.question ||
                            q.q}
                        </p>

                      </div>

                    </div>

                    {/* BOOKMARK */}

                    <button
                      onClick={() =>
                        toggleBookmark(
                          id
                        )
                      }
                    >
                      <Star
                        size={20}
                        className={
                          isBookmarked
                            ? "fill-black text-black"
                            : "text-gray-400"
                        }
                      />
                    </button>

                  </div>

                  {/* LABELS */}

                  {q.labels?.length ? (
                    <div className="flex flex-wrap gap-2 mt-4">

                      {q.labels.map(
                        (
                          l,
                          idx
                        ) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full text-white ${l.type ===
                              "city"
                              ? "bg-blue-500"
                              : "bg-green-600"
                              }`}
                          >
                            {
                              l.value
                            }
                          </span>
                        )
                      )}

                    </div>
                  ) : null}

                  {/* ANSWER */}

                  {isOpen && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 p-4 rounded-2xl">

                      <p className="font-semibold mb-3">
                        Answer:
                      </p>

                      <div
                        className="
w-full
min-w-0
text-gray-700
leading-7
whitespace-normal
max-w-full
overflow-hidden
break-normal

[&_p]:mb-4
[&_li]:mb-2

[&_strong]:font-bold

[&_img]:max-w-full
[&_img]:h-auto

[&_pre]:overflow-x-auto

[&_table]:block
[&_table]:overflow-x-auto

[&_h1]:text-3xl
[&_h1]:font-bold
[&_h1]:mb-4

[&_h2]:text-2xl
[&_h2]:font-semibold
[&_h2]:mt-6
[&_h2]:mb-3

[&_ul]:list-disc
[&_ul]:pl-6
[&_ul]:mb-4

[&_ol]:list-decimal
[&_ol]:pl-6

[&_blockquote]:border-l-4
[&_blockquote]:pl-4
[&_blockquote]:italic
"
                        dangerouslySetInnerHTML={{
                          __html:
                            typeof (q.answer || q.a) === "string" &&
                              (
                                (q.answer || q.a)?.includes("<p") ||
                                (q.answer || q.a)?.includes("<strong") ||
                                (q.answer || q.a)?.includes("<ul") ||
                                (q.answer || q.a)?.includes("<ol") ||
                                (q.answer || q.a)?.includes("<div")
                              )
                              ? (q.answer || q.a)!.replace(/&nbsp;/g, " ")
                              : (q.answer || q.a)!
                                .replace(/\n/g, "<br/>"),
                        }}
                      />

                    </div>
                  )}

                </div>
              );
            }
          )}

          {/* EMPTY */}

          {filteredQuestions.length ===
            0 && (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center">

                <p className="text-gray-500">
                  No questions found.
                </p>

              </div>
            )}

        </div>

      </div>

      {/* ================= FILTER ================= */}

      {showFilter && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">

          <div className="bg-white w-full max-w-md mx-auto p-5 rounded-t-3xl">

            <div className="flex justify-between items-center mb-4">

              <h2 className="font-bold text-lg">
                Filter Labels
              </h2>

              <button
                onClick={() =>
                  setShowFilter(false)
                }
              >
                ✕
              </button>

            </div>

            <div className="flex flex-wrap gap-2 mb-5">

              {labelOptions.map(
                (l) => (
                  <button
                    key={l}
                    onClick={() =>
                      toggleLabel(
                        l
                      )
                    }
                    className={`px-3 py-2 text-xs rounded-xl border ${selectedLabels.includes(
                      l
                    )
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-200"
                      }`}
                  >
                    {l}
                  </button>
                )
              )}

            </div>

            <button
              onClick={() =>
                setShowFilter(false)
              }
              className="w-full bg-black text-white p-3 rounded-2xl"
            >
              Done
            </button>

          </div>

        </div>
      )}

      {/* ================= BOTTOM NAV ================= */}

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-sm z-40">

        <div className="max-w-md mx-auto flex items-center justify-around py-3">

          {/* HOME */}

          <button
            onClick={() =>
              router.push("/")
            }
            className="flex flex-col items-center justify-center text-gray-500"
          >

            <Home size={22} />

            <span className="text-xs mt-1">
              Home
            </span>

          </button>

          {/* FILTER */}

          <button
            onClick={() =>
              setShowFilter(true)
            }
            className="flex flex-col items-center justify-center text-gray-500"
          >

            <Filter size={22} />

            <span className="text-xs mt-1">
              Filter
            </span>

          </button>

          {/* AI CHAT */}

          <button
            onClick={() =>
              router.push(
                `/chat/${topicId}`
              )
            }
            className="flex flex-col items-center justify-center text-cyan-600"
          >

            <Bot size={22} />

            <span className="text-xs mt-1">
              NAVIK BRO
            </span>

          </button>

          {/* REVISION */}

          <button
            onClick={() =>
              router.push(
                `/revision/${topicId}`
              )
            }
            className="flex flex-col items-center justify-center text-gray-500"
          >

            <BookOpen size={22} />

            <span className="text-xs mt-1">
              Revision
            </span>

          </button>

        </div>

      </nav>

    </main>
  );
}