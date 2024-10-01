import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title =
    searchParams.get("title") || "Stay Focused; Un-Tab Your Distractions";
  const description =
    searchParams.get("description") ||
    "The productivity chrome extension that works";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#EEF2FF",
          backgroundImage: "linear-gradient(to bottom right, #EEF2FF, #E0E7FF)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <line x1="4" y1="10" x2="20" y2="10" />
            <line x1="10" y1="4" x2="10" y2="20" />
          </svg>
          <h1
            style={{
              fontSize: 80,
              fontWeight: "bold",
              background: "linear-gradient(to right, #4F46E5, #818CF8)",
              backgroundClip: "text",
              color: "transparent",
              marginLeft: 20,
            }}
          >
            UnTab.xyz
          </h1>
        </div>
        <h2
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: "#1E40AF",
            textAlign: "center",
            marginBottom: 20,
            padding: "0 20px",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 30,
            color: "#3730A3",
            textAlign: "center",
            margin: 0,
            padding: "0 40px",
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#4F46E5",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 12 }}
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Get UnTab Now
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
