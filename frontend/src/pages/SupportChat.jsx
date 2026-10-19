import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_SUPPORT_API_URL || "http://localhost:8000";

export default function SupportChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I can help with payment and order questions. I can explain the general process, but I can’t look up a personal transaction. Please don’t share OTPs, CVVs, UPI PINs, passwords, or full card details." },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setMessages((items) => [...items, { role: "user", text: message }]);
    setDraft("");
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Support is temporarily unavailable.");
      setMessages((items) => [...items, { role: "assistant", text: data.answer }]);
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", text: error.message || "Could not reach the support assistant. Please try again later." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-800">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">← Back to ChorBazar</Link>
        <section className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 bg-indigo-600 px-6 py-5 text-white">
            <h1 className="text-2xl font-bold">Payment & order help</h1>
            <p className="mt-1 text-sm text-indigo-100">Ask about payment confirmation, cancellations, or refund status.</p>
          </header>
          <div className="flex min-h-[55vh] flex-col gap-4 p-5 sm:p-6" aria-live="polite">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "user" ? "ml-auto bg-indigo-600 text-white" : "mr-auto bg-gray-100 text-gray-800"}`}>
                {item.text}
              </div>
            ))}
            {busy && <p className="text-sm text-gray-400">Checking the support guide…</p>}
          </div>
          <form onSubmit={sendMessage} className="flex gap-3 border-t border-gray-100 p-4 sm:p-5">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Type your payment or order question…" className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" aria-label="Your question" />
            <button disabled={busy || !draft.trim()} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Send</button>
          </form>
          <p className="px-5 pb-5 text-xs text-gray-400">For a specific transaction, sign in and check My Orders. Never share payment security codes here.</p>
        </section>
      </div>
    </main>
  );
}
