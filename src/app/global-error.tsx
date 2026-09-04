"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          fontFamily: "Georgia, serif",
          background: "#fcf9f4",
          color: "#191611",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 400 }}>Something went wrong</h1>
        <p style={{ fontFamily: "Helvetica Neue, Arial, sans-serif", color: "#4b463f" }}>
          Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            background: "#85522f",
            color: "#ffffff",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "2px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
