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
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  ArrowLeft,
  Sailboat,
  BookOpen,
  ChevronRight,
  Home,
  Bookmark,
  Filter,
  Search,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase";

import LoadingScreen from "@/components/LoadingScreen";

/* =========================
   FUNCTION TITLES
========================= */

const functionNames: any = {
  fn3: "SAFETY",
  fn4b: "MOTOR",
  fn5: "ELECTRICAL",
  fn6: "MEP",
};

export default function TopicsPage() {
  const router = useRouter();

  const params = useParams();

  const classId =
    params.classId as string;

  const functionId =
    params.functionId as string;

  const user = auth.currentUser;

  const [topics, setTopics] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchText, setSearchText] =
    useState("");

  const functionTitle =
    functionNames?.[functionId] ||
    "Topics";

  /* =========================
     FETCH TOPICS
  ========================= */

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, "topics"),

          where(
            "classId",
            "==",
            classId
          ),

          where(
            "functionId",
            "==",
            functionId
          )
        );

        const querySnapshot =
          await getDocs(q);

        const fetchedTopics: any[] =
          [];

        querySnapshot.forEach((doc) => {
          fetchedTopics.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setTopics(fetchedTopics);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();

  }, [classId, functionId]);

  /* =========================
     SEARCH FILTER
  ========================= */

  const filteredTopics =
    topics.filter((topic: any) => {

      const title =
        topic.title?.toLowerCase() ||
        "";

      const description =
        topic.description?.toLowerCase() ||
        "";

      const search =
        searchText.toLowerCase();

      return (
        title.includes(search) ||
        description.includes(search)
      );
    });

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

            <div className="w-12 h-12 flex items-center justify-center rotate-[-8deg]">

              <Sailboat
                size={30}
                strokeWidth={2}
                className="text-black"
              />

            </div>

          </div>

          {/* USER */}

          <div className="mb-4">

            <p className="text-gray-500 text-sm mb-1">
              Welcome back 👋
            </p>

            <h1 className="text-2xl font-bold tracking-tight">
              Hi,{" "}
              {user?.email?.split(
                "@"
              )[0] || "Navigator"}
            </h1>

          </div>

          {/* BADGES */}

          <div className="flex items-center gap-3 flex-wrap">

            <div className="bg-black text-white px-4 py-2 rounded-2xl text-sm font-medium">
              {classId.toUpperCase()}
            </div>

            <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl text-sm font-medium">
              {functionId.toUpperCase()}
            </div>

          </div>

          {/* TITLE */}

          <div className="mt-5">

            <h2 className="text-xl font-bold leading-tight">
              {functionTitle}
            </h2>

            <div className="mt-5 border-l-4 border-cyan-500 pl-4"></div>
            <p className="text-base md:text-lg font-medium italic text-gray-700 leading-7">
              “Don’t think from where to Begin.
              Just Start —
              <span className="text-cyan-600 font-semibold">
                {" "}Success Follows Consistency."
              </span>
            </p>
          </div>

        </div>

        {/* SEARCH */}

        <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2 mb-5">

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
            placeholder="Search topics..."
            className="w-full outline-none bg-transparent"
          />

        </div>

        {/* TOPICS */}

        <div>

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-sm font-bold tracking-[2px] text-gray-500">
              AVAILABLE TOPICS
            </h2>

            <p className="text-sm text-gray-400">
              {filteredTopics.length} Topics
            </p>

          </div>

          <div className="space-y-4">

            {filteredTopics.map(
              (topic: any) => (
                <button
                  key={topic.id}
                  onClick={() =>
                    router.push(
                      `/questions/${topic.id}`
                    )
                  }
                  className="w-full bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
                >

                  {/* LEFT */}

                  <div className="flex items-center gap-4">

                    <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center">

                      <BookOpen size={24} />

                    </div>

                    <div className="text-left">

                      <h3 className="text-lg font-semibold">
                        {topic.title}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {
                          topic.description
                        }
                      </p>

                    </div>

                  </div>

                  {/* RIGHT */}

                  <ChevronRight
                    size={22}
                    className="text-gray-400 group-hover:translate-x-1 transition-all"
                  />

                </button>
              )
            )}

            {/* EMPTY STATE */}

            {filteredTopics.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center">

                <p className="text-gray-500">
                  No topics found.
                </p>

              </div>
            )}

          </div>

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