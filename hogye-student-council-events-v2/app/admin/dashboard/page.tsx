"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  STATUS_LABEL,
  formatPeriod,
  getStatus,
  toDateInputValue,
} from "@/lib/status";

type EventItem = {
  id: string;
  title: string;
  description: string;
  naverFormUrl: string;
  isActive: boolean;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
};

const emptyForm = {
  title: "",
  description: "",
  naverFormUrl: "",
  isActive: true,
  imageUrl: "",
  startDate: "",
  endDate: "",
};

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function loadEvents() {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setError("행사 목록을 불러오지 못했어요.");
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // 로그인이 만료됐을 때 로그인 화면으로 보내기
  function handleUnauthorized() {
    alert("로그인이 만료됐어요. 다시 로그인해 주세요.");
    router.push("/admin");
    router.refresh();
  }

  function startEdit(event: EventItem) {
    setError("");
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      naverFormUrl: event.naverFormUrl,
      isActive: event.isActive,
      imageUrl: event.imageUrl || "",
      startDate: toDateInputValue(event.startDate),
      endDate: toDateInputValue(event.endDate),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handlePhotoUpload(file: File) {
    setError("");
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });

      const formData = new FormData();
      formData.append("file", compressed, file.name);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "사진 업로드에 실패했습니다.");
        return;
      }

      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      console.error(err);
      setError("사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/events/${editingId}` : "/api/events";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) return handleUnauthorized();
      if (res.ok) {
        resetForm();
        loadEvents();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "저장에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    setError("");
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.status === 401) return handleUnauthorized();
    if (!res.ok) {
      setError("삭제에 실패했습니다.");
      return;
    }
    if (editingId === id) resetForm();
    loadEvents();
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="admin-wrap">
      <div className="top-bar">
        <h1 className="admin-title">관리자 대시보드</h1>
        <div className="top-actions">
          <a className="btn-ghost" href="/" target="_blank" rel="noopener noreferrer">
            사이트 보기
          </a>
          <button className="btn-ghost" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">
          {editingId ? "행사 수정" : "새 행사 등록"}
        </h2>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>행사 제목</span>
            <input
              placeholder="예: 가을 체육대회"
              value={form.title}
              maxLength={80}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>행사 설명</span>
            <textarea
              placeholder="행사 내용, 일정, 장소, 유의사항 등을 자유롭게 적어주세요."
              rows={5}
              value={form.description}
              maxLength={2000}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="field">
            <span>네이버폼 링크</span>
            <input
              placeholder="https://naver.me/..."
              value={form.naverFormUrl}
              onChange={(e) => setForm({ ...form, naverFormUrl: e.target.value })}
              required
            />
          </label>

          <div className="row">
            <label className="field">
              <span>시작일 (선택)</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </label>
            <label className="field">
              <span>마감일 (선택)</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
          </div>
          <p className="hint">
            마감일이 지나면 자동으로 &quot;마감&quot;으로 바뀌고, 시작일 전에는
            &quot;예정&quot;으로 보여요.
          </p>

          <div className="field">
            <span>행사 사진</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />
            {uploading && <p className="hint">업로드 중...</p>}
            {form.imageUrl && (
              <div className="preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="미리보기" />
                <button
                  type="button"
                  className="btn-ghost small"
                  onClick={() => setForm({ ...form, imageUrl: "" })}
                >
                  사진 빼기
                </button>
              </div>
            )}
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            진행중으로 표시 (끄면 날짜와 상관없이 마감)
          </label>

          {error && <p className="error-text">{error}</p>}

          <div className="actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || uploading}
            >
              {saving ? "저장 중..." : editingId ? "수정 완료" : "등록"}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>
      </section>

      <h2 className="list-title">등록된 행사 ({events.length})</h2>
      {events.length === 0 && <p className="muted">아직 등록된 행사가 없어요.</p>}
      {events.map((event) => {
        const status = getStatus(event);
        const period = formatPeriod(event.startDate, event.endDate);
        return (
          <div key={event.id} className="admin-row">
            <div className="admin-thumb">
              {event.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.imageUrl} alt="" />
              ) : (
                <span>🎉</span>
              )}
            </div>
            <div className="admin-info">
              <span className={`badge inline ${status}`}>{STATUS_LABEL[status]}</span>
              <div className="admin-name">{event.title}</div>
              {period && <div className="admin-period">{period}</div>}
            </div>
            <div className="admin-row-actions">
              <button className="btn-ghost small" onClick={() => startEdit(event)}>
                수정
              </button>
              <button className="btn-danger small" onClick={() => handleDelete(event.id)}>
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </main>
  );
}
