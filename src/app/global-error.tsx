"use client";

/**
 * Replaces the root layout when it is the layout itself that failed, so this page
 * cannot rely on the app shell, its fonts, or its tokens being present.
 */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          background: "#f1f3f5",
          color: "#16181c",
          display: "flex",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "1.5rem",
        }}
      >
        <main
          style={{
            background: "#fff",
            borderRadius: "1.5rem",
            boxShadow: "0 1px 3px rgb(0 0 0 / 10%)",
            maxWidth: "32rem",
            padding: "2.5rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>
            iMeal could not start
          </h1>
          <p style={{ color: "#5b6169", margin: "0 0 1.5rem" }}>
            Reload the page to try again. Your recipes and plans are safe.
          </p>
          <button
            onClick={retry}
            style={{
              background: "#17803d",
              border: 0,
              borderRadius: "999px",
              color: "#fff",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 600,
              minHeight: "2.75rem",
              padding: "0 1.5rem",
            }}
            type="button"
          >
            Reload iMeal
          </button>
        </main>
      </body>
    </html>
  );
}
