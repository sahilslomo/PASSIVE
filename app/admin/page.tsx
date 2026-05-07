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
  Plus,
  Trash2,
  BookOpen,
  CircleHelp,
} from "lucide-react";

export default function AdminPage() {
  const [classId, setClassId] =
    useState("class2");

  const [functionId, setFunctionId] =
    useState("fn3");

  const [topicTitle, setTopicTitle] =
    useState("");

  const [topicDesc, setTopicDesc] =
    useState("");

  const [topics, setTopics] = useState<any[]>([]);

  const [selectedTopic, setSelectedTopic] =
    useState("");

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [editId, setEditId] =
    useState<string | null>(null);

  /* =========================
     LABEL SYSTEM (NEW)
  ========================= */

  const labelOptions = ["MUMBAI", "CHENNAI", "KOCHI", "KOLKATA"];
  const [labels, setLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState("");

  /* =========================
     LOAD TOPICS
  ========================= */

  const fetchTopics = async () => {
    const snapshot = await getDocs(collection(db, "topics"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTopics(data);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  /* =========================
     ADD TOPIC
  ========================= */

  const handleAddTopic = async () => {
    if (!topicTitle) return alert("Enter topic title");

    await addDoc(collection(db, "topics"), {
      classId,
      functionId,
      title: topicTitle,
      description: topicDesc,
    });

    setTopicTitle("");
    setTopicDesc("");
    fetchTopics();
  };

  /* =========================
     ADD / EDIT QUESTION
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
        type: labelOptions.includes(l) ? "city" : "tag",
        value: l,
      })),
    };

    if (editId) {
      await updateDoc(doc(db, "questions", editId), payload);
      setEditId(null);
    } else {
      await addDoc(collection(db, "questions"), payload);
    }

    setQuestion("");
    setAnswer("");
    setLabels([]);
    setCustomLabel("");

    fetchTopics();
  };

  /* =========================
     DELETE TOPIC
  ========================= */

  const handleDeleteTopic = async (id: string) => {
    await deleteDoc(doc(db, "topics", id));
    fetchTopics();
  };

  /* =========================
     LABEL HANDLERS
  ========================= */

  const toggleLabel = (label: string) => {
    if (labels.includes(label)) {
      setLabels(labels.filter((l) => l !== label));
    } else {
      setLabels([...labels, label]);
    }
  };

  const addCustomLabel = () => {
    if (!customLabel.trim()) return;

    const value = customLabel.trim().toUpperCase();

    if (!labels.includes(value)) {
      setLabels([...labels, value]);
    }

    setCustomLabel("");
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] p-5">

      <div className="max-w-md mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          NAVIK Admin
        </h1>

        {/* TOPIC SECTION */}
        <div className="bg-white rounded-3xl p-5 mb-8 border">

          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={20} />
            <h2 className="text-xl font-bold">Add Topic</h2>
          </div>

          <div className="space-y-4">

            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border p-2"
            >
              <option value="class2">Class 2</option>
              <option value="class4">Class 4</option>
            </select>

            <select
              value={functionId}
              onChange={(e) => setFunctionId(e.target.value)}
              className="w-full border p-2"
            >
              <option value="fn3">FN3</option>
              <option value="fn4b">FN4B</option>
              <option value="fn5">FN5</option>
              <option value="fn6">FN6</option>
            </select>

            <input
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Topic title"
              className="w-full border p-2"
            />

            <textarea
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder="Description"
              className="w-full border p-2"
            />

            <button
              onClick={handleAddTopic}
              className="w-full bg-black text-white p-2"
            >
              Add Topic
            </button>

          </div>
        </div>

        {/* QUESTION SECTION */}
        <div className="bg-white rounded-3xl p-5 mb-8 border">

          <div className="flex items-center gap-2 mb-5">
            <CircleHelp size={20} />
            <h2 className="text-xl font-bold">Add Question</h2>
          </div>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full border p-2 mb-3"
          >
            <option value="">Select Topic</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question"
            className="w-full border p-2 mb-2"
          />

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer"
            className="w-full border p-2 mb-2"
          />

          {/* LABELS */}
          <div className="flex flex-wrap gap-2 mb-2">
            {labelOptions.map((l) => (
              <button
                key={l}
                onClick={() => toggleLabel(l)}
                className={`px-2 py-1 text-xs border ${
                  labels.includes(l) ? "bg-black text-white" : ""
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-2">
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="border flex-1 p-1"
              placeholder="Custom label"
            />
            <button onClick={addCustomLabel}>+</button>
          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full bg-black text-white p-2"
          >
            {editId ? "Update Question" : "Add Question"}
          </button>

        </div>

        {/* TOPIC LIST */}
        <div className="space-y-4">

          {topics.map((t) => (
            <div key={t.id} className="bg-white p-4 border rounded-xl">

              <div className="flex justify-between">
                <b>{t.title}</b>

                <button onClick={() => handleDeleteTopic(t.id)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-sm text-gray-500">
                {t.classId} • {t.functionId}
              </p>

            </div>
          ))}

        </div>

      </div>
    </main>
  );
}