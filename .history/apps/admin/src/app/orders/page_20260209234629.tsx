"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiListOrders, type OrderSummary } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const data = await apiListOrders({ limit: 20 });
      setOrders(data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">주문</div>
          <nav className="flex gap-4 text-sm">
            <Link className="hover:underline" href="/">
              대시보드
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">주문 목록</h1>
          <button
            className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-zinc-50"
            onClick={() => void refresh()}
          >
            새로고침
          </button>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-600">
              <tr>
                <th className="px-4 py-3">OrderId</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId} className="border-t">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/orders/detail/?id=${encodeURIComponent(o.orderId)}`}>
                      {o.orderId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">
                    {o.amount} {o.currency}
                  </td>
                  <td className="px-4 py-3">{o.paymentId ?? "-"}</td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-zinc-500" colSpan={5}>
                    데이터 없음
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
