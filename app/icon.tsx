import { ImageResponse } from "next/og";
import { Sailboat } from "lucide-react";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "white",
        }}
      >
        <Sailboat size={52} strokeWidth={2.5} />
      </div>
    ),
    size
  );
}