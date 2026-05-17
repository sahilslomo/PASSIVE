"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type GlobalRequest = {
    id: string;

    topicId: string;

    fileName: string;

    extractedText: string;

    approved: boolean;
};

export default function GlobalFilesPage() {

    const [files, setFiles] =
        useState<GlobalRequest[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [approving, setApproving] =
        useState<string | null>(null);

    const loadRequests =
        async () => {

            try {

                const snap =
                    await getDocs(
                        collection(
                            db,
                            "globalFileRequests"
                        )
                    );

                const data =
                    snap.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as GlobalRequest[];

                setFiles(data);

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);
            }
        };

    useEffect(() => {

        loadRequests();

    }, []);

    const approveFile =
        async (
            request: GlobalRequest
        ) => {

            try {

                setApproving(
                    request.id
                );

                const response =
                    await fetch(
                        "/api/approve-global-file",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                requestId:
                                    request.id,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Approval failed"
                    );
                }

                alert(
                    "Approved successfully"
                );

                await loadRequests();

            } catch (error) {

                console.error(error);

                alert(
                    "Failed to approve"
                );

            } finally {

                setApproving(null);
            }
        };

    return (

        <main className="min-h-screen bg-[#f5f5f5] p-5">

            <div className="max-w-md mx-auto">

                <div className="bg-white border rounded-3xl p-5 mb-5">

                    <h1 className="text-2xl font-bold">
                        Global File Requests
                    </h1>

                    <p className="text-sm text-gray-500 mt-2">
                        Approve files
                    </p>

                </div>

                {loading && (

                    <p>
                        Loading...
                    </p>

                )}

                <div className="space-y-4">

                    {files.map((item) => (

                        <div
                            key={item.id}
                            className="bg-white border rounded-3xl p-5"
                        >

                            <h2 className="font-bold">
                                {item.fileName}
                            </h2>

                            <p className="text-sm text-gray-500 mt-2">

                                Topic:
                                {" "}
                                {item.topicId}

                            </p>

                            <div className="mt-5">

                                {item.approved ? (

                                    <div className="text-green-600 font-semibold">

                                        Approved

                                    </div>

                                ) : (

                                    <button
                                        onClick={() =>
                                            approveFile(item)
                                        }
                                        disabled={
                                            approving === item.id
                                        }
                                        className="bg-black text-white px-5 py-2 rounded-2xl"
                                    >

                                        {approving === item.id
                                            ? "Approving..."
                                            : "Approve"}

                                    </button>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </main>
    );
}