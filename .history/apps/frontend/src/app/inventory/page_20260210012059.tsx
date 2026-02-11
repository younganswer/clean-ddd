"use client";

import { useEffect, useState } from "react";
import { apiListInventoryItems, type InventoryItem } from "@/lib/api";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const data = await apiListInventoryItems({ limit: 50 });
      setItems(data);
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
        <h1 className="text-2xl font-semibold">재고</h1>
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
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.sku} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{i.sku}</td>
                <td className="px-4 py-3">{i.availableQuantity}</td>
                <td className="px-4 py-3">{i.reservedQuantity}</td>
                <td className="px-4 py-3">{new Date(i.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                  데이터 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        기본 시드: SKU-001 (available=100). 결제 성공 시 주문 items만큼 reserved로 이동합니다.
      </p>
    </>
  );
}
