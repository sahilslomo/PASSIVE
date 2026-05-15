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
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
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
  Lock,
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

  const [showSubscriptionModal, setShowSubscriptionModal] =
    useState(false);

  const [trialExpired, setTrialExpired] =
    useState(false);

  const [userClicks, setUserClicks] =
    useState(0);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const functionTitle =
    functionNames?.[functionId] ||
    "Topics";


  const handleSubscribe =
    async () => {

      try {

        const amount =
          classId === "class2"
            ? 299
            : 199;

        const response =
          await fetch(
            "/api/create-order",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                amount,
              }),
            }
          );

        const order =
          await response.json();

        const options = {
          key:
            process.env
              .NEXT_PUBLIC_RAZORPAY_KEY_ID,

          amount:
            order.amount,

          currency:
            order.currency,

          name: "NAVIK",

          description:
            classId === "class2"
              ? "MEO Class 2 Subscription"
              : "MEO Class 4 Subscription",

          order_id:
            order.id,

          handler:
            async function () {

              const user =
                auth.currentUser;

              if (!user) return;

              const userRef =
                doc(
                  db,
                  "users",
                  user.uid
                );

              await updateDoc(
                userRef,
                {
                  isSubscribed:
                    true,

                  subscribedClass:
                    classId,
                }
              );

              alert(
                "Payment Successful"
              );
            },

          theme: {
            color: "#000000",
          },
        };

        const razorpay =
          new (window as any)
            .Razorpay(options);

        razorpay.open();

      } catch (error) {

        console.error(error);

        alert(
          "Payment Failed"
        );
      }
    };

  /* =========================
 TRIAL SYSTEM
========================= */

  useEffect(() => {

    const checkTrial = async () => {

      try {

        const user = auth.currentUser;

        if (!user) {
          setCheckingAccess(false);
          return;
        }

        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userSnap =
          await getDoc(userRef);

        // FIRST TIME USER

        if (!userSnap.exists()) {

          await setDoc(userRef, {
            email: user.email || "",
            trialStartedAt: Date.now(),
            topicClicks: 0,
            isSubscribed: false,
          });

          setCheckingAccess(false);

          return;
        }

        const data = userSnap.data();

        const startedAt =
          data?.trialStartedAt || 0;

        const isSubscribed =
          data?.isSubscribed || false;

        const clicks =
          data?.topicClicks || 0;

        setUserClicks(clicks);

        // 24 HOUR CHECK

        const expired =
          Date.now() - startedAt >
          24 * 60 * 60 * 1000;

        if (
          expired &&
          !isSubscribed
        ) {

          setTrialExpired(true);

        }

      } catch (error) {

        console.error(error);

      } finally {

        setCheckingAccess(false);

      }
    };

    checkTrial();

  }, []);

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

  const filteredTopics = topics
    .filter((topic: any) => {

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
    })
    .sort((a: any, b: any) =>
      a.title.localeCompare(b.title)
    );


  /* =========================
 TOPIC CLICK
========================= */

  const handleTopicClick = async (
    topicId: string
  ) => {

    try {

      const user =
        auth.currentUser;

      // NO USER

      if (!user) {
        return;
      }

      // BLOCK EXPIRED USERS

      if (trialExpired) {
        return;
      }

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      // INCREMENT CLICKS

      await updateDoc(userRef, {
        topicClicks: increment(1),
      });

      const newClicks =
        userClicks + 1;

      setUserClicks(newClicks);

      // POPUP TRIGGERS

      const shouldShowPopup =
        newClicks === 1 ||
        newClicks === 10 ||
        newClicks === 50;

      if (shouldShowPopup) {

        setShowSubscriptionModal(true);

        return;
      }

      // NAVIGATE

      router.push(
        `/questions/${topicId}`
      );

    } catch (error) {

      console.error(error);

    }
  };

  /* =========================
     LOADER
  ========================= */

  if (loading) {
    return <LoadingScreen />;
  }
  if (checkingAccess) {
    return <LoadingScreen />;
  }

  if (trialExpired) {

    return (

      <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-5">

        <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-sm">

          <h1 className="text-3xl font-bold leading-tight">
            Your Free Trial Has Ended
          </h1>

          <p className="text-gray-600 mt-5 leading-7">
            Continue your preparation with full access to:
          </p>

          <div className="mt-6 space-y-4">

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-black" />
              <p>All oral questions</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-black" />
              <p>AI revision notes</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-black" />
              <p>All transcripts</p>
            </div>

          </div>

          <button
           onClick={handleSubscribe}
            className="w-full mt-8 bg-black text-white py-4 rounded-2xl font-semibold"
          >
            Subscribe Now
          </button>

        </div>

      </main>

    );
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

            <div className="mt-5 border-l-4 border-cyan-500 pl-4">
              <p className="text-base md:text-lg font-medium italic text-gray-700 leading-7">
                “Don’t think from where to Begin.
                Just Start —
                <span className="text-cyan-600 font-semibold">
                  {" "}Success Follows Consistency.”
                </span>
              </p>
            </div>
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
                    handleTopicClick(topic.id)
                  }
                  style={{
                    WebkitTapHighlightColor:
                      "transparent",
                  }}
                  className="
w-full
bg-white
border
border-gray-200
rounded-3xl
p-5
shadow-sm
flex
items-center
justify-between
group

transition-all
duration-150
ease-out

hover:shadow-md
hover:-translate-y-1

active:scale-[0.97]
active:bg-gray-100
active:shadow-inner
active:translate-y-[2px]

touch-manipulation
select-none
"
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

                      <div
                        className="text-sm text-gray-500 mt-2 italic whitespace-pre-line [&_navik]:font-bold [&_navik]:text-cyan-600"
                        dangerouslySetInnerHTML={{
                          __html: topic.description || "",
                        }}
                      />

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

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-sm backdrop-blur-lg z-50">

        <div className="max-w-md mx-auto flex items-center justify-around py-3">

          {/* HOME */}

          <button
            onClick={() =>
              router.push("/")
            }
            className="flex flex-col items-center text-gray-500 active:scale-95 transition-all duration-150"
          >

            <Home size={24} />

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

              <Filter size={24} />

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

              <Bookmark size={24} />

              <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">

                <Lock size={8} />

              </div>

            </div>

            <span className="text-xs mt-1">
              Bookmarks
            </span>

          </button>

        </div>

      </nav>
      {showSubscriptionModal && (

        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-5">

          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">

            <h2 className="text-2xl font-bold">
              Try NAVIK Free for 24 Hours
            </h2>

            <p className="text-gray-600 mt-4">
              Learn smarter. Revise faster.
            </p>

            <div className="flex flex-col gap-3 mt-8">

              <button
                onClick={() => {
                  handleSubscribe();
                }}
                className="w-full bg-black text-white py-4 rounded-2xl font-semibold"
              >
                Subscribe Now
              </button>

              <button
                onClick={() =>
                  setShowSubscriptionModal(false)
                }
                className="w-full border border-gray-300 py-4 rounded-2xl font-medium"
              >
                Continue Free Trial
              </button>

            </div>

          </div>

        </div>

      )}
    </main>
  );
}