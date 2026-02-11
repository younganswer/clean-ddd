"use client";

import Link from "next/link";
import { useState } from "react";
import { apiCreateOrder } from "@/lib/api";

export default function Home() {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">clean-ddd Admin</div>
          <nav className="flex gap-4 text-sm">
            <Link className="hover:underline" href="/orders">
              주문
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="mt-2 text-sm text-zinc-600">
          백엔드 데이터 구조 확인용 최소 어드민입니다.
        </p>

        <section className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">주문 생성</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs text-zinc-600">금액</span>
              <input
                className="h-10 rounded-md border px-3"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-zinc-600">통화</span>
              <select
                className="h-10 rounded-md border px-3"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <div className="grid gap-1">
              <span className="text-xs text-zinc-600">액션</span>
              <button
                className="h-10 rounded-md bg-zinc-900 px-3 text-white hover:bg-zinc-800"
                onClick={async () => {
                  setError(null);
                  setCreatedOrderId(null);
                  try {
                    const res = await apiCreateOrder({
                      amount: Number(amount),
                      currency,
                    });
                    setCreatedOrderId(res.orderId);
                  } catch (e: any) {
                    setError(String(e?.message ?? e));
                  }
                }}
              >
                생성
              </button>
            </div>
          </div>

          {createdOrderId && (
            <div className="mt-4 rounded-md border bg-zinc-50 p-3 text-sm">
              생성됨: <Link className="underline" href={`/orders/${createdOrderId}`}>{createdOrderId}</Link>
            </div>
          )}
          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        </section>
      </main>
    </div>
  );
}
