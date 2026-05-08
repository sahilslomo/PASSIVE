"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Trash2,
  BookOpen,
  CircleHelp,
  Pencil,
} from "lucide-react";

export default function AdminPage() {
  const [classId, setClassId] = useState("class2");

  const [functionId, setFunctionId] = useState("fn3");

  const [topicTitle, setTopicTitle] = useState("");

  const [topicDesc, setTopicDesc] = useState("");

  const [topics, setTopics] = useState<any[]>([]);

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

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
  }, []);

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
    id: string
  ) => {
    await deleteDoc(doc(db, "topics", id));

    fetchTopics();
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
    id: string
  ) => {
    await deleteDoc(doc(db, "questions", id));

    fetchQuestions();
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
      <div className="max-w-2xl mx-auto">

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
              placeholder="Description"
              className="w-full border p-3 rounded-xl"
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

            {topics.map((t) => (
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

          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder="Answer"
            className="w-full border p-3 rounded-xl mb-3"
          />

          {/* LABELS */}

          <div className="flex flex-wrap gap-2 mb-3">

            {labelOptions.map((l) => (
              <button
                key={l}
                onClick={() =>
                  toggleLabel(l)
                }
                className={`px-3 py-1 rounded-full border text-sm ${
                  labels.includes(l)
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

            {topics.map((t) => (
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
                        handleDeleteTopic(t.id)
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
                    .map((q) => (
                      <div
                        key={q.id}
                        className="border rounded-xl p-3 bg-gray-50"
                      >
                        <div className="flex justify-between gap-3">

                          <div className="flex-1">

                            <p className="font-medium">
                              Q. {q.q}
                            </p>

                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                              {q.a}
                            </p>

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
                                  q.id
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