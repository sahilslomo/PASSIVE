"use client";

import ReactMarkdown from "react-markdown";

import { useEffect, useState, useRef } from "react";

import { useParams, useRouter }
    from "next/navigation";

import {
    ArrowLeft,
    Sailboat,
    Home,
    BookOpen,
    Bot,
    MessageCircle,
} from "lucide-react";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import { db }
    from "@/lib/firebase";



import {
    getStudyFilesByTopic,
    LocalStudyFile,
} from "@/lib/localFiles";

import LoadingScreen from "@/components/LoadingScreen";

export default function ChatPage() {

    const params =
        useParams();

    const router = useRouter();

    const [useQuestions, setUseQuestions] =
        useState(true);

    const [useTranscripts, setUseTranscripts] =
        useState(true);

    const [useGlobalFiles, setUseGlobalFiles] =
        useState(true);

    const [useLocalFiles, setUseLocalFiles] =
        useState(true);

    const [pageLoading, setPageLoading] =
        useState(true);

    const topicId =
        params.topicId as string;

    const [topicName, setTopicName] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [messages, setMessages] =
        useState<
            {
                role: string;
                content: string;
            }[]
        >([]);

    const [loading, setLoading] =
        useState(false);

    const [localFiles, setLocalFiles] =
        useState<LocalStudyFile[]>([]);

    const messagesEndRef =
        useRef<HTMLDivElement | null>(null);

    const sendMessage =
        async () => {

            if (
                !message.trim() ||
                loading
            ) return;

            setLoading(true);

            const userMessage = {
                role: "user",
                content: message,
            };

            const updatedMessages = [
                ...messages,
                userMessage,
            ];

            setMessages(updatedMessages);

            const currentMessage =
                message;

            setMessage("");

            try {

                const response =
                    await fetch(
                        "/api/chat",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                topicId,
                                message:
                                    currentMessage,

                                messages: [
                                    ...messages,
                                    userMessage,
                                ],

                                useQuestions,
                                useTranscripts,
                                useGlobalFiles,
                                useLocalFiles,

                                uploadedFiles:
                                    useLocalFiles
                                        ? localFiles
                                        : [],
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Request failed"
                    );
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content:
                            data.reply ||
                            "No response received.",
                    },
                ]);

            } catch (error: any) {

                console.error(error);

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content:
                            error.message ||
                            "Something went wrong.",
                    },
                ]);

            } finally {

                setLoading(false);
            }
        };



    useEffect(() => {

        const loadData = async () => {

            try {

                /* LOCAL FILES */

                const files =
                    await getStudyFilesByTopic(
                        topicId
                    );

                setLocalFiles(files);

                /* TOPIC */

                const topicRef =
                    doc(
                        db,
                        "topics",
                        topicId
                    );

                const topicSnap =
                    await getDoc(topicRef);

                if (topicSnap.exists()) {

                    const data =
                        topicSnap.data();

                    setTopicName(
                        data.title || ""
                    );
                }

            } finally {

                setPageLoading(false);
            }
        };

        loadData();

    }, [topicId]);

    useEffect(() => {

        messagesEndRef.current
            ?.scrollIntoView({
                behavior: "smooth",
            });

    }, [messages, loading]);

    if (pageLoading) {
        return <LoadingScreen />;
    }

    return (

        <main className="min-h-screen bg-[#f5f5f5] text-black pb-40">

            <div className="max-w-md mx-auto px-5 pt-5">

                {/* HEADER */}

                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm mb-4">

                    {/* TOP */}

                    <div className="flex items-center justify-between mb-6">

                        <button
                            onClick={() =>
                                router.push(
                                    `/questions/${topicId}`
                                )
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

                    {/* TITLE */}

                    <div>

                        <h1 className="text-3xl font-bold leading-tight">
                            {topicName}
                        </h1>

                        <p className="text-gray-500 mt-2 leading-6">
                            Ask anything about this topic
                        </p>

                        <div className="mt-5 border-l-4 border-cyan-500 pl-4">

                            <p className="text-base md:text-lg font-medium italic text-gray-700 leading-7">

                                “Learn Faster —
                                <span className="text-cyan-600 font-semibold">
                                    {" "}Ask Better Questions.
                                </span>

                            </p>

                        </div>

                    </div>

                </div>

                {/* SOURCES */}

                <div className="bg-white rounded-3xl border border-gray-200 p-5 mb-5">

                    <h2 className="font-bold mb-4">
                        Chat Sources
                    </h2>

                    <div className="space-y-3">

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                checked={useQuestions}
                                onChange={() =>
                                    setUseQuestions(
                                        !useQuestions
                                    )
                                }
                            />

                            <span>
                                Questions & Answers
                            </span>

                        </label>

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                checked={useTranscripts}
                                onChange={() =>
                                    setUseTranscripts(
                                        !useTranscripts
                                    )
                                }
                            />

                            <span>
                                Transcripts
                            </span>

                        </label>

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                checked={useGlobalFiles}
                                onChange={() =>
                                    setUseGlobalFiles(
                                        !useGlobalFiles
                                    )
                                }
                            />

                            <span>
                                Approved Global Files
                            </span>

                        </label>

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                checked={useLocalFiles}
                                onChange={() =>
                                    setUseLocalFiles(
                                        !useLocalFiles
                                    )
                                }
                            />

                            <span>
                                Local Uploaded Files
                            </span>

                        </label>

                    </div>

                </div>

                {/* CHAT */}

                <div className="space-y-4 mb-40">

                    {messages.map(
                        (msg, i) => (

                            <div
                                key={i}
                                className={`p-4 rounded-3xl leading-7 ${msg.role === "user"
                                    ? "bg-black text-white ml-10"
                                    : "bg-white border border-gray-200 mr-10"
                                    }`}
                            >

                                <ReactMarkdown
                                    components={{

                                        h1: ({ children }) => (
                                            <h1 className="text-3xl font-bold mb-4">
                                                {children}
                                            </h1>
                                        ),

                                        h2: ({ children }) => (
                                            <h2 className="text-2xl font-semibold mt-6 mb-3">
                                                {children}
                                            </h2>
                                        ),

                                        h3: ({ children }) => (
                                            <h3 className="text-xl font-semibold mt-4 mb-2">
                                                {children}
                                            </h3>
                                        ),

                                        p: ({ children }) => (
                                            <p className="mb-4">
                                                {children}
                                            </p>
                                        ),

                                        ul: ({ children }) => (
                                            <ul className="list-disc pl-6 mb-4">
                                                {children}
                                            </ul>
                                        ),

                                        ol: ({ children }) => (
                                            <ol className="list-decimal pl-6 mb-4">
                                                {children}
                                            </ol>
                                        ),

                                        li: ({ children }) => (
                                            <li className="mb-2">
                                                {children}
                                            </li>
                                        ),

                                        strong: ({ children }) => (
                                            <strong className="font-bold">
                                                {children}
                                            </strong>
                                        ),

                                        code: ({ children }) => (
                                            <code className="bg-gray-200 px-1 py-0.5 rounded">
                                                {children}
                                            </code>
                                        ),
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>

                            </div>

                        )
                    )}

                    {loading && (

                        <div className="bg-white border border-gray-200 rounded-3xl p-4 mr-10">

                            Thinking...

                        </div>

                    )}

                    <div ref={messagesEndRef} />

                </div>

            </div>

            {/* INPUT */}

            <div className="fixed bottom-20 left-0 right-0 px-4 z-40">

                <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-3 shadow-lg flex gap-3">

                    <input
                        value={message}
                        onChange={(e) =>
                            setMessage(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        placeholder="Ask anything..."
                        className="flex-1 outline-none px-2 bg-transparent"
                    />

                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="bg-black text-white px-5 py-3 rounded-2xl disabled:opacity-50"
                    >

                        Send

                    </button>

                </div>

            </div>

            {/* BOTTOM NAV */}

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

                    {/* QUESTIONS */}

                    <button
                        onClick={() =>
                            router.push(
                                `/questions/${topicId}`
                            )
                        }
                        className="flex flex-col items-center justify-center text-gray-500"
                    >

                        <MessageCircle size={22} />

                        <span className="text-xs mt-1">
                            Questions
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

                    {/* CHAT */}

                    <button
                        className="flex flex-col items-center justify-center text-cyan-600"
                    >

                        <Bot size={22} />

                        <span className="text-xs mt-1">
                            NAVIK BRO
                        </span>

                    </button>

                </div>

            </nav>

        </main>
    );
}