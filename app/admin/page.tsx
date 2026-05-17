"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
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

  const [requests, setRequests] =
    useState<GlobalRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [approveLoading, setApproveLoading] =
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

        setRequests(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };

  useEffect(() => {

    loadRequests();

  }, []);

  const approveRequest =
    async (request: GlobalRequest) => {

      try {

        setApproveLoading(request.id);

        await addDoc(
          collection(
            db,
            "globalFiles"
          ),
          {
            topicId:
              request.topicId,

            fileName:
              request.fileName,

            extractedText:
              request.extractedText,

            approved: true,

            createdAt:
              Date.now(),
          }
        );

        await updateDoc(
          doc(
            db,
            "globalFileRequests",
            request.id
          ),
          {
            approved: true,
          }
        );

        await loadRequests();

        alert(
          "Approved successfully"
        );

      } catch (error) {

        console.error(error);

        alert(
          "Approval failed"
        );

      } finally {

        setApproveLoading(null);
      }
    };

  return (

    <main className="p-5">

      <h1 className="text-2xl font-bold mb-5">
        Global File Requests
      </h1>

      {loading && (
        <p>Loading...</p>
      )}

      <div className="space-y-4">

        {requests.map((request) => (

          <div
            key={request.id}
            className="border rounded-2xl p-4"
          >

            <p>
              <strong>Topic:</strong>
              {" "}
              {request.topicId}
            </p>

            <p className="mt-2">
              <strong>File:</strong>
              {" "}
              {request.fileName}
            </p>

            <p className="mt-2">
              <strong>Status:</strong>
              {" "}
              {request.approved
                ? "Approved"
                : "Pending"}
            </p>

            {!request.approved && (

              <button
                onClick={() =>
                  approveRequest(request)
                }
                disabled={
                  approveLoading === request.id
                }
                className="mt-4 bg-black text-white px-4 py-2 rounded-xl"
              >

                {approveLoading === request.id
                  ? "Approving..."
                  : "Approve"}

              </button>

            )}

          </div>

        ))}

      </div>

    </main>
  );
}