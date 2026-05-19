"use client";

import ReactMarkdown from "react-markdown";

import { useEffect, useState } from "react";

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
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
    saveStudyFile,
    getStudyFilesByTopic,
    deleteStudyFile,
    LocalStudyFile,
} from "@/lib/localFiles";

import { extractPdfText } from "@/lib/extractPdfText";

import {
    ArrowLeft,
    Sailboat,
    Home,
    BookOpen,
    Bot,
    MessageCircle,
    Upload,
    Star,
    FileText,
} from "lucide-react";

type Bookmark = {
    questionId: string;
    topicId: string;
};

type Question = {
    id?: string;
    question?: string;
    q?: string;
    answer?: string;
    a?: string;
};

import LoadingScreen from "@/components/LoadingScreen";

export default function RevisionPage() {

    const params = useParams();

    const router = useRouter();

    const topicId =
        params.topicId as string;

    const [topicName, setTopicName] =
        useState("Topic");

    const [loading, setLoading] =
        useState(false);

    const [pageLoading, setPageLoading] =
        useState(true);

    const [files, setFiles] =
        useState<LocalStudyFile[]>([]);

    const [bookmarkedQuestions, setBookmarkedQuestions] =
        useState<Question[]>([]);

    const [openAnswers, setOpenAnswers] =
        useState<string[]>([]);

    const [revision, setRevision] =
        useState("");

    const [generating, setGenerating] =
        useState(false);

    const [
        useAllQuestions,
        setUseAllQuestions,
    ] = useState(true);

    const [
        useBookmarks,
        setUseBookmarks,
    ] = useState(true);

    const [
        useTranscripts,
        setUseTranscripts,
    ] = useState(true);

    const [
        useUploadedFiles,
        setUseUploadedFiles,
    ] = useState(true);

    const [
        approveLoading,
        setApproveLoading,
    ] = useState<string | null>(null);

    const [selectedFileId, setSelectedFileId] =
        useState("");


    /* =========================
LOAD TOPIC
========================= */

    const loadTopic = async () => {

        try {

            const topicRef =
                doc(db, "topics", topicId);

            const topicSnap =
                await getDoc(topicRef);

            if (topicSnap.exists()) {

                const topicData =
                    topicSnap.data();

                setTopicName(
                    topicData.title || "Topic"
                );
            }

        } finally {

            setPageLoading(false);
        }
    };

    /* =========================
       LOAD FILES
    ========================= */

    const loadFiles = async () => {

        const storedFiles =
            await getStudyFilesByTopic(
                topicId
            );

        setFiles(storedFiles);
    };

    /* =========================
       LOAD BOOKMARKS
    ========================= */

    const loadBookmarkedQuestions =
        async () => {

            try {

                const saved =
                    localStorage.getItem(
                        "bookmarks"
                    );

                if (!saved) {

                    setBookmarkedQuestions([]);

                    return;
                }

                const bookmarks: Bookmark[] =
                    JSON.parse(saved);

                const currentTopicBookmarks =
                    bookmarks.filter(
                        (b) =>
                            b.topicId === topicId
                    );

                if (
                    currentTopicBookmarks.length === 0
                ) {

                    setBookmarkedQuestions([]);

                    return;
                }

                const questionsQuery =
                    query(
                        collection(db, "questions"),
                        where(
                            "topicId",
                            "==",
                            topicId
                        )
                    );

                const questionsSnap =
                    await getDocs(
                        questionsQuery
                    );

                const allQuestions =
                    questionsSnap.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    ) as Question[];

                const filteredQuestions =
                    allQuestions.filter(
                        (q) =>
                            currentTopicBookmarks.some(
                                (b) =>
                                    b.questionId === q.id
                            )
                    );

                setBookmarkedQuestions(
                    filteredQuestions
                );

            } catch (error) {

                console.error(error);
            }
        };

    useEffect(() => {

        loadFiles();

        loadBookmarkedQuestions();

        loadTopic();

    }, []);

    /* =========================
       GENERATE REVISION
    ========================= */

    const generateRevision =
        async () => {

            try {

                setGenerating(true);

                setRevision("");

                const questionsQuery =
                    query(
                        collection(db, "questions"),
                        where("topicId", "==", topicId)
                    );

                const questionsSnap =
                    await getDocs(questionsQuery);

                const allQuestions =
                    questionsSnap.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })
                    );

                let questions: any[] = [];

                if (useAllQuestions) {

                    questions = allQuestions;
                }

                if (useBookmarks) {

                    const bookmarkedIds =
                        bookmarkedQuestions.map(
                            (q) => q.id
                        );

                    const onlyBookmarks =
                        allQuestions.filter(
                            (q: any) =>
                                bookmarkedIds.includes(q.id)
                        );

                    questions = [
                        ...questions,
                        ...onlyBookmarks,
                    ];

                    questions =
                        questions.filter(
                            (q, index, self) =>
                                index ===
                                self.findIndex(
                                    (x) => x.id === q.id
                                )
                        );
                }

                const transcriptsQuery =
                    query(
                        collection(db, "transcripts"),
                        where("topicId", "==", topicId)
                    );

                const transcriptsSnap =
                    await getDocs(transcriptsQuery);

                const transcripts =
                    useTranscripts
                        ? transcriptsSnap.docs.map(
                            (doc) => ({
                                id: doc.id,
                                ...doc.data(),
                            })
                        )
                        : [];

                const response =
                    await fetch(
                        "/api/revise",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                topicId,

                                questions:
                                    (
                                        useAllQuestions ||
                                        useBookmarks
                                    )
                                        ? questions
                                        : [],

                                transcripts:
                                    useTranscripts
                                        ? transcripts
                                        : [],

                                uploadedFiles:
                                    useUploadedFiles
                                        ? files
                                        : [],

                                useGlobalFiles:
                                    useUploadedFiles,
                            }),
                        }
                    );

                if (!response.body) return;

                const reader =
                    response.body.getReader();

                const decoder =
                    new TextDecoder();

                let done = false;

                while (!done) {

                    const result =
                        await reader.read();

                    done = result.done;

                    const chunk =
                        decoder.decode(
                            result.value ||
                            new Uint8Array()
                        );

                    setRevision(
                        (prev) => prev + chunk
                    );
                }

            } catch (error) {

                console.error(error);

                alert(
                    "Failed to generate revision"
                );

            } finally {

                setGenerating(false);

            }
        };



    /* =========================
       APPROVAL
    ========================= */

    const requestGlobalApproval =
        async (file: LocalStudyFile) => {

            try {

                setApproveLoading(file.id);

                const response =
                    await fetch(
                        "/api/request-global-file",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                topicId,

                                fileName: file.name,

                                extractedText:
                                    file.extractedText.slice(
                                        0,
                                        50000
                                    ),
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Failed request"
                    );
                }

                alert(
                    "Approval request sent"
                );

            } catch (error) {

                console.error(error);

                alert(
                    "Failed to send approval request"
                );

            } finally {

                setApproveLoading(null);

            }
        };

    const deleteFile = async () => {

        if (!selectedFileId) return;

        await deleteStudyFile(
            selectedFileId
        );

        await loadFiles();

        setSelectedFileId("");

        alert("File deleted");
    };


    /* =========================
       PDF UPLOAD
    ========================= */

    const handlePdfUpload =
        async (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {

            const file =
                e.target.files?.[0];

            if (!file) return;

            if (files.length >= 3) {

                alert(
                    "You can upload only 3 files per topic"
                );

                return;
            }

            try {

                setLoading(true);

                const extractedText =
                    await extractPdfText(file);

                const studyFile = {
                    id:
                        crypto.randomUUID(),

                    topicId,

                    name: file.name,

                    type: file.type,

                    extractedText,

                    uploadedAt:
                        Date.now(),
                };

                await saveStudyFile(
                    studyFile
                );

                await loadFiles();

                alert(
                    "PDF uploaded successfully"
                );

            } catch (error) {

                console.error(error);

                alert(
                    "Failed to read PDF"
                );

            } finally {

                setLoading(false);

            }
        };

    if (pageLoading) {
        return <LoadingScreen />;
    }

    return (

        <main className="min-h-screen bg-[#f5f5f5] text-black pb-32">

            <div className="max-w-md mx-auto px-5 pt-5 pb-10">

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
                            Revision
                        </h1>

                        <p className="text-gray-500 mt-2 leading-6">

                            {" "}

                            <span className="font-semibold text-black">
                                {topicName}
                            </span>

                        </p>

                        <div className="mt-5 border-l-4 border-cyan-500 pl-4">

                            <p className="text-base md:text-lg font-medium italic text-gray-700 leading-7">

                                “Understand Faster —
                                <span className="text-cyan-600 font-semibold">
                                    {" "}Revise Smarter.
                                </span>

                            </p>

                        </div>

                    </div>

                </div>

                {/* PDF UPLOAD */}

                <div className="bg-white rounded-3xl border border-gray-200 p-5 mb-5">

                    <div className="flex items-center gap-3 mb-5">

                        <div>

                            <h2 className="font-bold">
                                Upload Study PDF
                            </h2>

                            <p className="text-sm text-gray-500">
                                Maximum 3 files allowed
                            </p>

                        </div>

                    </div>

                    <label className="w-full">

                        <div className="w-full border border-gray-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">

                                    <Upload size={18} />

                                </div>

                                <div>

                                    <p className="font-medium text-sm">
                                        Choose PDF File
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        No file chosen
                                    </p>

                                </div>

                            </div>

                        </div>

                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                        />

                    </label>

                    {loading && (

                        <p className="mt-4 text-sm text-gray-600">
                            Reading PDF...
                        </p>

                    )}

                </div>

                {/* UPLOADED FILES */}

                {files.length > 0 && (

                    <div className="bg-white rounded-3xl border border-gray-200 p-5 mb-5">

                        <h2 className="font-bold mb-4">
                            Send PDFs for ADMIN'S APPROVAL to improve AI Revision.
                        </h2>

                        {/* DROPDOWN */}

                        <select
                            value={selectedFileId}
                            onChange={(e) =>
                                setSelectedFileId(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-200 rounded-2xl p-3 outline-none"
                        >

                            <option value="">
                                Select Uploaded File
                            </option>

                            {files.map((file) => (

                                <option
                                    key={file.id}
                                    value={file.id}
                                >
                                    {file.name}
                                </option>

                            ))}

                        </select>

                        {/* ACTION BUTTONS */}

                        {selectedFileId && (

                            <div className="flex gap-3 mt-4">

                                {/* APPROVAL */}

                                <button
                                    onClick={() => {

                                        const file =
                                            files.find(
                                                (f) =>
                                                    f.id === selectedFileId
                                            );

                                        if (file) {
                                            requestGlobalApproval(file);
                                        }
                                    }}
                                    className="flex-1 bg-black text-white py-3 rounded-2xl text-sm"
                                >

                                    Send For Approval

                                </button>

                                {/* DELETE */}

                                <button
                                    onClick={deleteFile}
                                    className="flex-1 border border-red-200 text-red-600 py-3 rounded-2xl text-sm"
                                >

                                    Delete

                                </button>

                            </div>

                        )}

                    </div>

                )}

                {/* SOURCES */}

                <div className="bg-white rounded-3xl border border-gray-200 p-5 mb-5">

                    <h2 className="font-bold mb-4">
                        Revision Sources
                    </h2>

                    <div className="space-y-3">

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                checked={useAllQuestions}
                                onChange={() =>
                                    setUseAllQuestions(
                                        !useAllQuestions
                                    )
                                }
                            />

                            <span>
                                All Questions & Answers
                            </span>

                        </label>

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                checked={useBookmarks}
                                onChange={() =>
                                    setUseBookmarks(
                                        !useBookmarks
                                    )
                                }
                            />

                            <span>
                                Bookmarked Questions
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
                                checked={useUploadedFiles}
                                onChange={() =>
                                    setUseUploadedFiles(
                                        !useUploadedFiles
                                    )
                                }
                            />

                            <span>
                                Uploaded Files
                            </span>

                        </label>

                    </div>

                </div>


                {/* GENERATE */}

                <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm mb-5">

                    <button
                        onClick={generateRevision}
                        disabled={generating}
                        className="w-full bg-black text-white py-3 rounded-2xl font-medium text-sm"
                    >

                        {generating
                            ? "Generating Revision..."
                            : "✨ Revise With 🪄 Study Genie"}

                    </button>

                    {revision && (

                        <div className="mt-4 border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">

                            {/* HEADER */}

                            <div className="px-4 py-3 border-b bg-white font-semibold text-sm">

                                🪄 Study Genie

                            </div>

                            {/* CONTENT */}

                            <div
                                className="
h-[420px]
overflow-y-auto
p-4
leading-7
text-gray-700
whitespace-pre-wrap
"
                            >

                                {generating &&
                                    revision.length === 0 && (

                                        <div className="flex gap-1 items-center">

                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />

                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />

                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />

                                        </div>

                                    )}

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
                                            <strong className="font-bold text-black">
                                                {children}
                                            </strong>
                                        ),
                                    }}
                                >
                                    {revision}
                                </ReactMarkdown>

                            </div>

                        </div>

                    )}

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
                        className="flex flex-col items-center justify-center text-cyan-600"
                    >

                        <BookOpen size={22} />

                        <span className="text-xs mt-1">
                            Revision
                        </span>

                    </button>

                    {/* CHAT */}

                    <button
                        onClick={() =>
                            router.push(
                                `/chat/${topicId}`
                            )
                        }
                        className="flex flex-col items-center justify-center text-gray-500"
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