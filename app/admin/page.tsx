"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query, 
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Trash2,
  BookOpen,
  CircleHelp,
  Pencil,
} from "lucide-react";

import dynamic from "next/dynamic";

import "react-quill-new/dist/quill.snow.css";

import "./quill.css";

const ReactQuill = dynamic(
  () => import("react-quill-new"),
  { ssr: false }
);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "align",
  "list",
  "blockquote",
  "code-block",
  "link",
  "image",
];

export default function AdminPage() {
  const [classId, setClassId] = useState("class2");

  const [functionId, setFunctionId] = useState("fn3");

  const [topicTitle, setTopicTitle] = useState("");

  const [topicDesc, setTopicDesc] = useState("");

  const [topics, setTopics] = useState<any[]>([]);

  const [transcriptName, setTranscriptName] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [transcripts, setTranscripts] = useState<any[]>([]);

  const [questions, setQuestions] = useState<any[]>([]);

  const [selectedTopic, setSelectedTopic] = useState("");

  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState("");

  const [editQuestionId, setEditQuestionId] =
    useState<string | null>(null);

  const [editTopicId, setEditTopicId] =
    useState<string | null>(null);

  /* =========================
     LABEL SYSTEM
  ========================= */

  const labelOptions = [
    "MUMBAI",
    "CHENNAI",
    "KOCHI",
    "KOLKATA",
  ];

  const [labels, setLabels] = useState<string[]>([]);

  const [customLabel, setCustomLabel] =
    useState("");

  /* =========================
     FETCH DATA
  ========================= */

  const fetchTopics = async () => {
    const snapshot = await getDocs(
      collection(db, "topics")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTopics(data);
  };

  const fetchQuestions = async () => {
    const snapshot = await getDocs(
      collection(db, "questions")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setQuestions(data);
  };

  const fetchTranscripts = async (topicId: string) => {
    if (!topicId) {
      setTranscripts([]);
      return;
    }

    const q = query(
      collection(db, "transcripts"),
      where("topicId", "==", topicId)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTranscripts(data);
  };

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchTranscripts(selectedTopic);
    }
  }, [selectedTopic]);


  /* =========================
     ADD / UPDATE TOPIC
  ========================= */

  const handleAddTopic = async () => {
    if (!topicTitle) {
      alert("Enter topic title");
      return;
    }

    const payload = {
      classId,
      functionId,
      title: topicTitle,
      description: topicDesc,
    };

    if (editTopicId) {
      await updateDoc(
        doc(db, "topics", editTopicId),
        payload
      );

      setEditTopicId(null);
    } else {
      await addDoc(collection(db, "topics"), payload);
    }

    setTopicTitle("");
    setTopicDesc("");

    fetchTopics();
  };

  /* =========================
     EDIT TOPIC
  ========================= */

  const handleEditTopic = (topic: any) => {
    setEditTopicId(topic.id);

    setTopicTitle(topic.title);

    setTopicDesc(topic.description || "");

    setClassId(topic.classId);

    setFunctionId(topic.functionId);
  };

  /* =========================
     DELETE TOPIC
  ========================= */

  const handleDeleteTopic = async (
    id: string,
    title: string
  ) => {

    const confirmed = window.confirm(
      `Delete Topic "${title}"?\n\nThis will permanently remove the topic.`
    );

    if (!confirmed) return;

    try {

      await deleteDoc(
        doc(db, "topics", id)
      );

      fetchTopics();

      alert("Topic deleted successfully");

    } catch (error) {

      console.error(error);

      alert("Failed to delete topic");
    }
  };

/* =========================
   ADD TRANSCRIPT
========================= */

const handleAddTranscript = async () => {
  if (!selectedTopic) {
    alert("Select a topic first");
    return;
  }

  if (!transcriptName || !transcriptText) {
    alert("Fill all transcript fields");
    return;
  }

  try {
    await addDoc(collection(db, "transcripts"), {
      topicId: selectedTopic,
      name: transcriptName,
      text: transcriptText,
      createdAt: Date.now(),
    });

    setTranscriptName("");
    setTranscriptText("");

    fetchTranscripts(selectedTopic);
  } catch (error) {
    console.error(error);
  }
};


  /* =========================
     ADD / UPDATE QUESTION
  ========================= */

  const handleAddQuestion = async () => {

    if (!selectedTopic || !question) {
      alert("Fill all fields");
      return;
    }

    const payload = {
      topicId: selectedTopic,
      q: question,
      a: answer,
      labels: labels.map((l) => ({
        type: labelOptions.includes(l)
          ? "city"
          : "tag",
        value: l,
      })),
    };

    if (editQuestionId) {
      await updateDoc(
        doc(db, "questions", editQuestionId),
        payload
      );

      setEditQuestionId(null);
    } else {
      await addDoc(
        collection(db, "questions"),
        payload
      );
    }

    setQuestion("");
    setAnswer("");
    setLabels([]);
    setCustomLabel("");

    fetchQuestions();
  };

  /* =========================
     EDIT QUESTION
  ========================= */

  const handleEditQuestion = (q: any) => {
    setEditQuestionId(q.id);

    setSelectedTopic(q.topicId);

    setQuestion(q.q);

    setAnswer(q.a);

    setLabels(
      q.labels?.map((l: any) => l.value) || []
    );
  };

  /* =========================
     DELETE QUESTION
  ========================= */

  const handleDeleteQuestion = async (
    id: string,
    questionText: string
  ) => {

    const confirmed = window.confirm(
      `Delete this question?\n\n"${questionText}"`
    );

    if (!confirmed) return;

    try {

      await deleteDoc(
        doc(db, "questions", id)
      );

      fetchQuestions();

      alert("Question deleted successfully");

    } catch (error) {

      console.error(error);

      alert("Failed to delete question");
    }
  };

  /* =========================
     LABEL HANDLERS
  ========================= */

  const toggleLabel = (label: string) => {
    if (labels.includes(label)) {
      setLabels(
        labels.filter((l) => l !== label)
      );
    } else {
      setLabels([...labels, label]);
    }
  };

  const addCustomLabel = () => {
    if (!customLabel.trim()) return;

    const value =
      customLabel.trim().toUpperCase();

    if (!labels.includes(value)) {
      setLabels([...labels, value]);
    }

    setCustomLabel("");
  };

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-[#f5f5f5] p-5">
      <div className="max-w-2xl mx-auto w-full overflow-x-hidden">

        <h1 className="text-3xl font-bold mb-8">
          NAVIK Admin
        </h1>

        {/* ================= TOPIC SECTION ================= */}

        <div className="bg-white rounded-3xl p-5 mb-8 border">

          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={20} />

            <h2 className="text-xl font-bold">
              {editTopicId
                ? "Edit Topic"
                : "Add Topic"}
            </h2>
          </div>

          <div className="space-y-4">

            <select
              value={classId}
              onChange={(e) =>
                setClassId(e.target.value)
              }
              className="w-full border p-3 rounded-xl"
            >
              <option value="class2">
                Class 2
              </option>

              <option value="class4">
                Class 4
              </option>
            </select>

            <select
              value={functionId}
              onChange={(e) =>
                setFunctionId(e.target.value)
              }
              className="w-full border p-3 rounded-xl"
            >
              <option value="fn3">FN3</option>

              <option value="fn4b">
                FN4B
              </option>

              <option value="fn5">FN5</option>

              <option value="fn6">FN6</option>
            </select>

            <input
              value={topicTitle}
              onChange={(e) =>
                setTopicTitle(e.target.value)
              }
              placeholder="Topic title"
              className="w-full border p-3 rounded-xl"
            />

            <textarea
              value={topicDesc}
              onChange={(e) =>
                setTopicDesc(e.target.value)
              }
              placeholder="Topic description"
              className="w-full border p-3 rounded-xl min-h-[120px]"
            />



            <button
              onClick={handleAddTopic}
              className="w-full bg-black text-white p-3 rounded-xl"
            >
              {editTopicId
                ? "Update Topic"
                : "Add Topic"}
            </button>

          </div>
        </div>


        {/* ================= TRANSCRIPT SECTION ================= */}

        <div className="bg-white rounded-3xl p-5 mb-8 border">

          <h2 className="text-xl font-bold mb-4">
            Add Transcript
          </h2>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full border p-3 rounded-xl mb-3"
          >
            <option value="">Select Topic</option>

            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <input
            value={transcriptName}
            onChange={(e) => setTranscriptName(e.target.value)}
            placeholder="Transcript Name"
            className="w-full border p-3 rounded-xl mb-3"
          />

          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Transcript Text"
            className="w-full border p-3 rounded-xl min-h-[120px] mb-3"
          />

          <button
            onClick={handleAddTranscript}
            className="w-full bg-black text-white p-3 rounded-xl"
          >
            Add Transcript
          </button>

        </div>

        {/* ================= QUESTION SECTION ================= */}

        <div className="bg-white rounded-3xl p-5 mb-8 border">

          <div className="flex items-center gap-2 mb-5">
            <CircleHelp size={20} />

            <h2 className="text-xl font-bold">
              {editQuestionId
                ? "Edit Question"
                : "Add Question"}
            </h2>
          </div>

          <select
            value={selectedTopic}
            onChange={(e) =>
              setSelectedTopic(e.target.value)
            }
            className="w-full border p-3 rounded-xl mb-3"
          >
            <option value="">
              Select Topic
            </option>

            {[...topics]
              .sort((a: any, b: any) =>
                a.title.localeCompare(b.title)
              )
              .map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.title}
                </option>
              ))}
          </select>

          <input
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            placeholder="Question"
            className="w-full border p-3 rounded-xl mb-3"
          />

          <div className="mb-3">
            <ReactQuill
              theme="snow"
              value={answer}
              onChange={setAnswer}
              modules={modules}
              formats={formats}
              className="bg-white rounded-xl mb-12 min-h-[250px]"
              placeholder="Write formatted answer..."
            />
          </div>

          {/* LABELS */}

          <div className="flex flex-wrap gap-2 mb-3">

            {labelOptions.map((l) => (
              <button
                key={l}
                onClick={() =>
                  toggleLabel(l)
                }
                className={`px-3 py-1 rounded-full border text-sm ${labels.includes(l)
                  ? "bg-black text-white"
                  : "bg-white"
                  }`}
              >
                {l}
              </button>
            ))}

          </div>

          <div className="flex gap-2 mb-3">

            <input
              value={customLabel}
              onChange={(e) =>
                setCustomLabel(e.target.value)
              }
              className="border flex-1 p-2 rounded-xl"
              placeholder="Custom label"
            />

            <button
              onClick={addCustomLabel}
              className="bg-black text-white px-4 rounded-xl"
            >
              +
            </button>

          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full bg-black text-white p-3 rounded-xl"
          >
            {editQuestionId
              ? "Update Question"
              : "Add Question"}
          </button>

        </div>

        {/* ================= TOPICS LIST ================= */}

        <div className="mb-10">

          <h2 className="text-2xl font-bold mb-4">
            Topics
          </h2>

          <div className="space-y-4">

            {[...topics]
              .sort((a: any, b: any) =>
                a.title.localeCompare(b.title)
              )
              .map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 border rounded-2xl"
                >
                  <div className="flex justify-between items-start">

                    <div>
                      <h3 className="font-bold text-lg">
                        {t.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {t.classId} •{" "}
                        {t.functionId}
                      </p>

                      {t.description && (
                        <p className="text-sm mt-2">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          handleEditTopic(t)
                        }
                        className="p-2 border rounded-lg"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteTopic(
                            t.id,
                            t.title
                          )
                        }
                        className="p-2 border rounded-lg text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </div>

                  {/* QUESTIONS */}

                  <div className="mt-5 space-y-3">

                    {questions
                      .filter(
                        (q) =>
                          q.topicId === t.id
                      )
                      .sort((a: any, b: any) =>
                        a.q.localeCompare(b.q)
                      )
                      .map((q) => (
                        <div
                          key={q.id}
                          className="border rounded-xl p-3 bg-gray-50 overflow-hidden"
                        >
                          <div className="flex justify-between gap-3">

                            <div className="flex-1 min-w-0 overflow-hidden">

                              <p className="font-medium">
                                Q. {q.q}
                              </p>

                              <div
                                className="
    text-sm
    text-gray-700
    mt-2
    leading-7
    whitespace-normal
    overflow-wrap-anywhere
    overflow-hidden
    min-w-0
    max-w-full

    [&_h1]:text-3xl
    [&_h1]:font-bold
    [&_h1]:mb-4

    [&_h2]:text-2xl
    [&_h2]:font-semibold
    [&_h2]:mt-6
    [&_h2]:mb-3

    [&_p]:mb-4

    [&_ul]:list-disc
    [&_ul]:pl-6
    [&_ul]:mb-4

    [&_ol]:list-decimal
    [&_ol]:pl-6

    [&_li]:mb-2

    [&_strong]:font-bold

    [&_blockquote]:border-l-4
    [&_blockquote]:pl-4
    [&_blockquote]:italic
  "
                                dangerouslySetInnerHTML={{
                                  __html:
                                    typeof q.a === "string" &&
                                      (
                                        q.a.includes("<p") ||
                                        q.a.includes("<strong") ||
                                        q.a.includes("<ul") ||
                                        q.a.includes("<ol") ||
                                        q.a.includes("<h1") ||
                                        q.a.includes("<div")
                                      )
                                      ? q.a.replace(/&nbsp;/g, " ")
                                      : q.a
                                        ?.replace(/\n/g, "<br/>"),
                                }}
                              />

                              {q.labels?.length >
                                0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">

                                    {q.labels.map(
                                      (
                                        l: any,
                                        i: number
                                      ) => (
                                        <span
                                          key={i}
                                          className="text-xs bg-black text-white px-2 py-1 rounded-full"
                                        >
                                          {l.value}
                                        </span>
                                      )
                                    )}

                                  </div>
                                )}

                            </div>

                            <div className="flex flex-col gap-2">

                              <button
                                onClick={() =>
                                  handleEditQuestion(
                                    q
                                  )
                                }
                                className="p-2 border rounded-lg"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteQuestion(
                                    q.id,
                                    q.q
                                  )
                                }
                                className="p-2 border rounded-lg text-red-500"
                              >
                                <Trash2 size={15} />
                              </button>

                            </div>
                          </div>
                        </div>
                      ))}

                  </div>
                </div>
              ))}

          </div>
        </div>
      </div>
    </main>
  );
}