import React from "react";

// ─── Calendar event data ─────────────────────────────────────────────────────
const CAL_EVENT = {
  title: "Свадьба Иры и Артёма",
  location: "In Gremi, Kakheti, Georgia",
  description:
    "Вы приглашены на свадьбу Иры и Артёма — два дня в горах Кахетии с теми, кто важен.",
  // Asia/Tbilisi = UTC+4; 14:00 local = 10:00 UTC
  startUtc: "20260622T100000Z",
  endUtc: "20260623T190000Z",
  // For services that accept local time + timezone
  startLocal: "2026-06-22T14:00:00",
  endLocal: "2026-06-23T23:00:00",
  timeZone: "Asia/Tbilisi",
};

// ─── URL builders ─────────────────────────────────────────────────────────────

function googleCalendarUrl() {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: CAL_EVENT.title,
    dates: `${CAL_EVENT.startUtc}/${CAL_EVENT.endUtc}`,
    details: CAL_EVENT.description,
    location: CAL_EVENT.location,
    ctz: CAL_EVENT.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function outlookUrl() {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: CAL_EVENT.title,
    startdt: CAL_EVENT.startLocal,
    enddt: CAL_EVENT.endLocal,
    location: CAL_EVENT.location,
    body: CAL_EVENT.description,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`;
}

function office365Url() {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: CAL_EVENT.title,
    startdt: CAL_EVENT.startLocal,
    enddt: CAL_EVENT.endLocal,
    location: CAL_EVENT.location,
    body: CAL_EVENT.description,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p}`;
}

function downloadIcs() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//Wedding Ira & Artem//RU",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;TZID=${CAL_EVENT.timeZone}:20260622T140000`,
    `DTEND;TZID=${CAL_EVENT.timeZone}:20260623T230000`,
    `SUMMARY:${CAL_EVENT.title}`,
    `LOCATION:${CAL_EVENT.location}`,
    `DESCRIPTION:${CAL_EVENT.description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wedding-ira-artem.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Platform detection ───────────────────────────────────────────────────────
function detectPlatform() {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios"; // iPad desktop mode
  return "other";
}

// ─── Options list ─────────────────────────────────────────────────────────────
function buildOptions() {
  const platform = detectPlatform();
  const all = [
    {
      key: "google",
      label: "Google Календарь",
      action: () => window.open(googleCalendarUrl(), "_blank"),
    },
    {
      key: "apple",
      label: "Apple Календарь",
      action: downloadIcs,
    },
    {
      key: "outlook",
      label: "Outlook",
      action: () => window.open(outlookUrl(), "_blank"),
    },
    {
      key: "office365",
      label: "Office 365",
      action: () => window.open(office365Url(), "_blank"),
    },
    {
      key: "ical",
      label: "iCal (.ics)",
      action: downloadIcs,
    },
  ];
  // Sort: put the most relevant option first for the platform
  if (platform === "ios") {
    return [all[1], all[0], all[4], all[2], all[3]]; // Apple first
  }
  if (platform === "android") {
    return [all[0], all[2], all[3], all[4], all[1]]; // Google first
  }
  return all; // desktop: Google, Apple, Outlook, Office365, iCal
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddToCalendar() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const options = buildOptions();

  return (
    <div
      ref={ref}
      className="text-center"
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#5C1F1F",
          color: "#D4B896",
          border: "1px solid rgba(168,134,74,0.6)",
          borderRadius: "3px",
          padding: "10px 22px",
          fontSize: "0.9rem",
          fontFamily: "Lora, Georgia, serif",
          fontStyle: "italic",
          letterSpacing: "0.05em",
          cursor: "pointer",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Добавить в календарь
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1F2A24",
            border: "1px solid rgba(168,134,74,0.4)",
            borderRadius: "3px",
            minWidth: "210px",
            zIndex: 50,
            boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => {
                opt.action();
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                borderBottom:
                  i < options.length - 1
                    ? "1px solid rgba(168,134,74,0.15)"
                    : "none",
                padding: "10px 16px",
                color: "#D4B896",
                fontSize: "0.875rem",
                fontFamily: "Lora, Georgia, serif",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(168,134,74,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              {i === 0 && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#A8864A",
                    fontStyle: "italic",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "1px",
                  }}
                >
                  рекомендуем
                </span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
