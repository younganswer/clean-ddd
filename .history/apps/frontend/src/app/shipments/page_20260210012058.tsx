"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiListShipments, type ShipmentSummary } from "@/lib/api";

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const data = await apiListShipments({ limit: 30 });
      setShipments(data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">배송 목록</h1>
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
              <th className="px-4 py-3">ShipmentId</th>
              <th className="px-4 py-3">OrderId</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.shipmentId} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{s.shipmentId}</td>
                <td className="px-4 py-3">
                  <Link className="underline" href={`/orders/detail/?id=${encodeURIComponent(s.orderId)}`}>
                    {s.orderId}
                  </Link>
                </td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">{new Date(s.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {shipments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                  데이터 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
