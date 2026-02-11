"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiCreatePaymentIntent, apiGetOrder, type OrderDetail } from "@/lib/api";

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50">
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <div className="text-lg font-semibold">주문 상세</div>
              <nav className="flex gap-4 text-sm">
                <Link className="hover:underline" href="/orders/">
                  목록
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-600">로딩 중…</main>
        </div>
      }
    >
      <OrderDetailInner />
    </Suspense>
  );
}

function OrderDetailInner() {
  const search = useSearchParams();
  const orderId = search.get("id") ?? "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"SUCCEEDED" | "FAILED">("SUCCEEDED");

  async function refresh() {
    if (!orderId) return;
    setError(null);
    try {
      const data = await apiGetOrder(orderId);
      setOrder(data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  useEffect(() => {
    void refresh();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">주문 상세</div>
          <nav className="flex gap-4 text-sm">
            <Link className="hover:underline" href="/orders/">
              목록
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{orderId || "(id 없음)"}</h1>
          <button
            className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-zinc-50"
            disabled={!orderId}
            onClick={() => void refresh()}
          >
            새로고침
          </button>
        </div>

        {!orderId && (
          <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-zinc-600">
            쿼리 파라미터로 <code className="rounded bg-zinc-100 px-1">?id=...</code> 를 전달해 주세요.
          </div>
        )}

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {order && (
          <div className="mt-6 grid gap-6">
            <section className="rounded-xl border bg-white p-6">
              <h2 className="text-lg font-semibold">주문 정보</h2>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Status</dt>
                  <dd>{order.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Amount</dt>
                  <dd>
                    {order.amount} {order.currency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">PaymentId</dt>
                  <dd>{order.paymentId ?? "-"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border bg-white p-6">
              <h2 className="text-lg font-semibold">결제 인텐트 생성(시뮬레이터)</h2>
              <p className="mt-2 text-sm text-zinc-600">
                생성 즉시 PENDING으로 저장되고, SQS Delay로 웹훅 이벤트가 비동기 전달됩니다.
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">결과</span>
                  <select
                    className="h-10 rounded-md border px-3"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as any)}
                  >
                    <option value="SUCCEEDED">SUCCEEDED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </label>

                <button
                  className="h-10 rounded-md bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800"
                  onClick={async () => {
                    setError(null);
                    try {
                      await apiCreatePaymentIntent(orderId, { simulateOutcome: outcome });
                      await refresh();
                    } catch (e: any) {
                      setError(String(e?.message ?? e));
                    }
                  }}
                >
                  결제 인텐트 생성
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
