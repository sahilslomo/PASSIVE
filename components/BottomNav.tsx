"use client";

import { Home, Filter, Bookmark, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-white border-t border-gray-200 shadow-sm backdrop-blur-lg">
      
      <div className="
        w-full 
        max-w-md 
        md:max-w-4xl 
        lg:max-w-6xl 
        xl:max-w-7xl 
        mx-auto 
        flex 
        items-center 
        justify-around 
        py-3 
        px-2
        md:px-6
        lg:px-10
      ">

        {/* HOME */}
        <button
          onClick={() => router.push("/")}
          className="flex flex-col items-center text-black font-semibold active:scale-95 transition-all duration-150"
        >
          <Home size={22} />
          <span className="text-xs mt-1">Home</span>
        </button>

        {/* FILTER LOCKED */}
        <button
          onClick={() =>
            alert("Filter available inside Questions Page")
          }
          className="flex flex-col items-center text-gray-400 relative active:scale-95 transition-all duration-150"
        >
          <div className="relative">
            <Filter size={22} />

            <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">
              <Lock size={8} />
            </div>
          </div>

          <span className="text-xs mt-1">Filter</span>
        </button>

        {/* BOOKMARK LOCKED */}
        <button
          onClick={() =>
            alert("Bookmarks available inside Questions Page")
          }
          className="flex flex-col items-center text-gray-400 relative active:scale-95 transition-all duration-150"
        >
          <div className="relative">
            <Bookmark size={22} />

            <div className="absolute -top-1 -right-2 bg-black text-white rounded-full p-[3px] shadow-sm">
              <Lock size={8} />
            </div>
          </div>

          <span className="text-xs mt-1">Bookmarks</span>
        </button>

      </div>
    </nav>
  );
}