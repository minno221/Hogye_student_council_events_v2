"use client";

import { useEffect, useState } from "react";
import {
  STATUS_LABEL,
  formatPeriod,
  type EventView,
} from "@/lib/status";

type Filter = "all" | "active" | "closed";

const PLACEHOLDERS = [
  "linear-gradient(135deg, #dbeafe, #e0e7ff)",
  "linear-gradient(135deg, #fce7f3, #ffe4e6)",
  "linear-gradient(135deg, #dcfce7, #ccfbf1)",
  "linear-gradient(135deg, #fef3c7, #ffedd5)",
  "linear-gradient(135deg, #ede9fe, #fae8ff)",
];

function placeholderFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return PLACEHOLDERS[sum % PLACEHOLDERS.length];
}

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function Thumb({ event, className }: { event: EventView; className: string }) {
  if (event.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={event.imageUrl}
        alt={event.title}
        className={className}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${className} placeholder`}
      style={{ background: placeholderFor(event.id) }}
      aria-hidden="true"
    >
      🎉
    </div>
  );
}

export default function EventList({ events }: { events: EventView[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<EventView | null>(null);

  const visible = events.filter((e) => {
    if (filter === "active") return e.status !== "closed";
    if (filter === "closed") return e.status === "closed";
    return true;
  });

  const counts = {
    all: events.length,
    active: events.filter((e) => e.status !== "closed").length,
    closed: events.filter((e) => e.status === "closed").length,
  };

  // 팝업이 열려 있을 때: ESC로 닫기 + 뒤 화면 스크롤 막기
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "active", label: "진행중" },
    { key: "closed", label: "마감" },
  ];

  return (
    <>
      <div className="chips" role="tablist" aria-label="행사 필터">
        {chips.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={filter === c.key}
            className={`chip ${filter === c.key ? "on" : ""}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
            <span className="chip-count">{counts[c.key]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          {events.length === 0
            ? "아직 등록된 행사가 없어요."
            : "해당하는 행사가 없어요."}
        </div>
      ) : (
        <div className="grid">
          {visible.map((event) => {
            const period = formatPeriod(event.startDate, event.endDate);
            return (
              <button
                key={event.id}
                className={`card ${event.status === "closed" ? "is-closed" : ""}`}
                onClick={() => setSelected(event)}
              >
                <div className="card-media">
                  <Thumb event={event} className="card-img" />
                  <span className={`badge ${event.status}`}>
                    {STATUS_LABEL[event.status]}
                  </span>
                </div>
                <div className="card-body">
                  <h2 className="card-title">{event.title}</h2>
                  {period && <p className="card-period">{period}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="backdrop"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="닫기"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            <div className="modal-media">
              <Thumb event={selected} className="modal-img" />
            </div>

            <div className="modal-body">
              <span className={`badge inline ${selected.status}`}>
                {STATUS_LABEL[selected.status]}
              </span>
              <h2 className="modal-title">{selected.title}</h2>
              {formatPeriod(selected.startDate, selected.endDate) && (
                <p className="modal-period">
                  📅 {formatPeriod(selected.startDate, selected.endDate)}
                </p>
              )}
              <p className="modal-desc">
                {selected.description || "행사 설명이 아직 없어요."}
              </p>
            </div>

            <div className="modal-footer">
              {selected.status === "active" && isSafeUrl(selected.naverFormUrl) ? (
                <a
                  className="btn-primary"
                  href={selected.naverFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  네이버폼 바로가기 →
                </a>
              ) : selected.status === "upcoming" ? (
                <button className="btn-primary" disabled>
                  {formatPeriod(selected.startDate, null)} 신청할 수 있어요
                </button>
              ) : (
                <button className="btn-primary" disabled>
                  마감된 행사예요
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
