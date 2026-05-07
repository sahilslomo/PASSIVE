"use client";

import { Sailboat } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center">

        {/* WAVES */}
        <div className="relative w-64 h-24 flex items-end justify-center overflow-hidden mb-2">

          {/* WAVE 1 */}
          <div className="absolute bottom-0 w-[300px] h-6 bg-black/10 rounded-[100%] animate-wave1" />

          {/* WAVE 2 */}
          <div className="absolute bottom-2 w-[260px] h-5 bg-black/5 rounded-[100%] animate-wave2" />

          {/* SHIP */}
          <div className="relative animate-float">
            <Sailboat
              size={70}
              strokeWidth={2}
              className="text-black"
            />
                     </div>
        </div>

        {/* TEXT */}
        <h2 className="text-2xl font-bold tracking-tight mt-6">
          NAVIK
        </h2>

        <p className="text-gray-500 mt-2 text-sm tracking-wide">
          Loading oral questions...
        </p>
      </div>
    </div>
  );
}