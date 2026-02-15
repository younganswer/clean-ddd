import { useEffect, useRef, useState } from "react";

import {
	apiGetGraph,
	apiListInventoryItems,
	apiListUsers,
	type GraphView,
	type InventoryItem,
} from "@/lib/api";
import {
	DEFAULT_DEPTH,
	DEFAULT_MAX_EVENTS,
	DEFAULT_MAX_NODES,
	finiteOrDefault,
	isRootType,
} from "@/app/graph/_lib/graph-helpers";

type Input = {
	rootType: string | null;
	rootId: string | null;
	depth: number;
	maxEvents: number;
	maxNodes: number;
	includeEvents: boolean;
	refreshTrigger: number;
	onReplaceRoute: (href: string) => void;
};

export function useGraphData(input: Input) {
	const {
		rootType,
		rootId,
		depth,
		maxEvents,
		maxNodes,
		includeEvents,
		refreshTrigger,
		onReplaceRoute,
	} = input;

	const [graph, setGraph] = useState<GraphView | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [inventoryLoading, setInventoryLoading] = useState(false);
	const [selectedSku, setSelectedSku] = useState<string>("");

	const autoSelectedRef = useRef(false);

	useEffect(() => {
		let active = true;
		setInventoryLoading(true);
		void (async () => {
			try {
				const res = await apiListInventoryItems({ limit: 50, page: 1 });
				if (!active) return;
				const list = res.items ?? [];
				setInventoryItems(list);
				if (list.length > 0 && !selectedSku) {
					setSelectedSku(list[0]?.sku ?? "");
				}
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			} finally {
				if (active) setInventoryLoading(false);
			}
		})();
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (autoSelectedRef.current) return;
		if (isRootType(rootType) && rootId) return;
		autoSelectedRef.current = true;
		let active = true;
		setError(null);
		void (async () => {
			try {
				const res = await apiListUsers({ limit: 1, page: 1 });
				if (!active) return;
				const first = res.items[0];
				if (!first?.userId) {
					setError(
						"기본 사용자 선택 실패: 사용자 데이터가 없습니다.",
					);
					return;
				}

				const sp = new URLSearchParams();
				sp.set("rootType", "USER");
				sp.set("rootId", first.userId);
				sp.set("depth", String(finiteOrDefault(depth, DEFAULT_DEPTH)));
				sp.set(
					"maxEvents",
					String(finiteOrDefault(maxEvents, DEFAULT_MAX_EVENTS)),
				);
				sp.set(
					"maxNodes",
					String(finiteOrDefault(maxNodes, DEFAULT_MAX_NODES)),
				);
				sp.set("includeEvents", String(includeEvents));
				onReplaceRoute(`/?${sp.toString()}`);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(`기본 사용자 선택 실패: ${message}`);
			}
		})();
		return () => {
			active = false;
		};
	}, [
		rootType,
		rootId,
		depth,
		maxEvents,
		maxNodes,
		includeEvents,
		onReplaceRoute,
	]);

	useEffect(() => {
		const rt = rootType;
		const rid = rootId;
		if (!isRootType(rt) || !rid) {
			setGraph(null);
			return;
		}

		let active = true;
		setLoading(true);
		setError(null);
		void (async () => {
			try {
				const res = await apiGetGraph({
					rootType: rt,
					rootId: rid,
					depth: finiteOrDefault(depth, DEFAULT_DEPTH),
					maxEvents: finiteOrDefault(maxEvents, DEFAULT_MAX_EVENTS),
					maxNodes: finiteOrDefault(maxNodes, DEFAULT_MAX_NODES),
					includeEvents,
				});
				if (!active) return;
				setGraph(res);
				setSelectedId(res.rootNodeId);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
				setGraph(null);
				setSelectedId(null);
			} finally {
				if (active) setLoading(false);
			}
		})();

		return () => {
			active = false;
		};
	}, [
		rootType,
		rootId,
		depth,
		maxEvents,
		maxNodes,
		includeEvents,
		refreshTrigger,
	]);

	return {
		graph,
		loading,
		error,
		setError,
		selectedId,
		setSelectedId,
		inventoryItems,
		inventoryLoading,
		selectedSku,
		setSelectedSku,
	};
}
