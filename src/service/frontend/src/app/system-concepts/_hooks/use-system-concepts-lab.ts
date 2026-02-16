import { useCallback, useEffect, useMemo, useState } from "react";
import {
	apiCreateOrder,
	apiCreatePaymentIntent,
	apiGetOrder,
	apiGetPaymentIntent,
	apiGetShipmentByOrderId,
	apiListInventoryItems,
	apiListUsers,
	type InventoryItem,
	type OrderDetail,
	type PaymentIntent,
	type ShipmentSummary,
	type UserProfile,
} from "@/lib/api";
import {
	STEPS,
	deriveApiStepStatuses,
	formatPhaseLabel,
	type RunPhase,
	type StepStatus,
} from "@/app/system-concepts/_lib/system-concepts";

export const useSystemConceptsLab = () => {
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [selectedUserId, setSelectedUserId] = useState("");
	const [selectedSku, setSelectedSku] = useState("");
	const [inputLoading, setInputLoading] = useState(true);

	const [phase, setPhase] = useState<RunPhase>("idle");
	const [orderId, setOrderId] = useState("");
	const [paymentId, setPaymentId] = useState("");
	const [outboxId, setOutboxId] = useState("");
	const [delaySeconds, setDelaySeconds] = useState<number | null>(null);
	const [order, setOrder] = useState<OrderDetail | null>(null);
	const [payment, setPayment] = useState<PaymentIntent | null>(null);
	const [shipment, setShipment] = useState<ShipmentSummary | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
	const [nowTick, setNowTick] = useState(() => Date.now());
	const [previewIndex, setPreviewIndex] = useState(0);
	const [completedUntil, setCompletedUntil] = useState(-1);
	const [completionAcknowledged, setCompletionAcknowledged] = useState(false);
	const [showCompletionSummary, setShowCompletionSummary] = useState(false);

	const isPolling =
		phase === "awaiting-payment" || phase === "awaiting-shipment";

	const { statuses: apiStatuses } = useMemo(
		() =>
			deriveApiStepStatuses({
				orderId,
				paymentId,
				outboxId,
				order,
				payment,
				shipment,
			}),
		[orderId, paymentId, outboxId, order, payment, shipment],
	);

	const maxNavigableIndex = useMemo(() => {
		if (!orderId) return 0;
		return STEPS.length - 1;
	}, [orderId]);

	const statuses = useMemo(() => {
		const next: Record<string, StepStatus> = {};
		const hasStarted = Boolean(orderId);
		const lastIndex = STEPS.length - 1;

		for (let index = 0; index < STEPS.length; index += 1) {
			const step = STEPS[index];
			const apiStatus = apiStatuses[step.id] ?? "pending";

			if (!hasStarted) {
				next[step.id] = "idle";
				continue;
			}

			if (!paymentId && index >= 4) {
				next[step.id] = "idle";
				continue;
			}

			if (apiStatus === "failed") {
				next[step.id] = "failed";
				continue;
			}

			if (apiStatus === "skipped") {
				next[step.id] = "skipped";
				continue;
			}

			if (index <= completedUntil) {
				next[step.id] = "succeeded";
				continue;
			}

			const isCurrent = !showCompletionSummary && index === previewIndex;
			if (isCurrent) {
				if (index === lastIndex && completionAcknowledged) {
					next[step.id] = "succeeded";
				} else {
					next[step.id] = "running";
				}
				continue;
			}

			next[step.id] = "pending";
		}

		return next;
	}, [
		apiStatuses,
		completedUntil,
		completionAcknowledged,
		orderId,
		paymentId,
		previewIndex,
		showCompletionSummary,
	]);

	const previewStep = STEPS[previewIndex] ?? STEPS[0];
	const canCreatePayment =
		Boolean(orderId) && statuses["order-infra"] === "succeeded";
	const isFlowCompleted =
		completionAcknowledged && statuses["shipment"] === "succeeded";
	const selectedUser = useMemo(
		() => users.find((user) => user.userId === selectedUserId) ?? null,
		[selectedUserId, users],
	);
	const selectedItem = useMemo(
		() => inventoryItems.find((item) => item.sku === selectedSku) ?? null,
		[selectedSku, inventoryItems],
	);
	const previewApiStatus = apiStatuses[previewStep.id] ?? "pending";
	const previewLabStatus = statuses[previewStep.id] ?? "pending";
	const canAcknowledgeCompletion = apiStatuses["shipment"] === "succeeded";
	const displayPhaseLabel = isFlowCompleted
		? "COMPLETED"
		: formatPhaseLabel(phase);
	const timeoutRemaining = useMemo(() => {
		if (!runStartedAt) return null;
		const elapsed = nowTick - runStartedAt;
		return Math.max(0, 60000 - elapsed);
	}, [nowTick, runStartedAt]);

	const refresh = useCallback(async () => {
		if (!orderId) return;
		setError(null);
		const nextOrder = await apiGetOrder(orderId);
		const resolvedPaymentId = paymentId || nextOrder.paymentId || "";
		const nextPayment = resolvedPaymentId
			? await apiGetPaymentIntent(resolvedPaymentId)
			: null;
		const nextShipment = await apiGetShipmentByOrderId(orderId);

		setOrder(nextOrder);
		setShipment(nextShipment);
		if (resolvedPaymentId) {
			setPaymentId(resolvedPaymentId);
		}
		setPayment(nextPayment);

		if (nextPayment?.status === "FAILED") {
			setPhase("failed");
			return;
		}

		if (
			nextPayment?.status === "SUCCEEDED" &&
			nextOrder.status === "PAID"
		) {
			if (nextShipment) {
				setPhase("completed");
				return;
			}
			setPhase("awaiting-shipment");
			return;
		}

		if (resolvedPaymentId) {
			setPhase("awaiting-payment");
		}
	}, [orderId, paymentId]);

	const refreshWithErrorHandling = useCallback(() => {
		void refresh().catch((e: unknown) => {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		});
	}, [refresh]);

	useEffect(() => {
		let active = true;
		void (async () => {
			setInputLoading(true);
			setError(null);
			try {
				const [userPage, itemPage] = await Promise.all([
					apiListUsers({ limit: 50, page: 1 }),
					apiListInventoryItems({ limit: 50, page: 1 }),
				]);
				if (!active) return;
				const nextUsers = userPage.items ?? [];
				const nextItems = itemPage.items ?? [];
				setUsers(nextUsers);
				setInventoryItems(nextItems);
				setSelectedUserId((prev) => prev || nextUsers[0]?.userId || "");
				setSelectedSku((prev) => prev || nextItems[0]?.sku || "");
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			} finally {
				if (!active) return;
				setInputLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const handleCreateOrder = useCallback(async () => {
		setError(null);
		setPhase("starting-order");
		setPaymentId("");
		setOutboxId("");
		setDelaySeconds(null);
		setPayment(null);
		setShipment(null);
		setRunStartedAt(null);
		setCompletedUntil(-1);
		setCompletionAcknowledged(false);
		setShowCompletionSummary(false);

		if (!selectedUser) {
			setError("선택 가능한 사용자가 없습니다.");
			setPhase("idle");
			return;
		}
		if (!selectedItem) {
			setError("선택 가능한 재고가 없습니다.");
			setPhase("idle");
			return;
		}
		if (selectedItem.availableQuantity < 1) {
			setError("선택한 재고의 가용 수량이 없습니다.");
			setPhase("idle");
			return;
		}
		try {
			const created = await apiCreateOrder({
				userId: selectedUser.userId,
				amount: selectedItem.price.amountMinor,
				currency: selectedItem.price.currency,
				items: [
					{
						sku: selectedItem.sku,
						quantity: 1,
					},
				],
			});
			const persistedOrder = await apiGetOrder(created.orderId);
			const persistedShipment = await apiGetShipmentByOrderId(
				created.orderId,
			);
			setOrderId(created.orderId);
			setOrder(persistedOrder);
			setShipment(persistedShipment);
			setPreviewIndex(0);
			setCompletedUntil(-1);
			setShowCompletionSummary(false);
			setPhase("order-ready");
		} catch (e: unknown) {
			setPhase("idle");
			setOrderId("");
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		}
	}, [selectedItem, selectedUser]);

	const handleCreatePaymentIntent = useCallback(async () => {
		if (!orderId) {
			setError("먼저 Order를 생성해 주세요.");
			return;
		}
		setError(null);
		setPhase("starting-payment");
		try {
			const created = await apiCreatePaymentIntent(orderId, {});
			setPaymentId(created.paymentId);
			setOutboxId(created.scheduled.outboxId);
			setDelaySeconds(created.scheduled.delaySeconds);
			setRunStartedAt(Date.now());
			setPhase("awaiting-payment");
			setPreviewIndex(4);
			setCompletionAcknowledged(false);
			setShowCompletionSummary(false);
			await refresh();
		} catch (e: unknown) {
			setPhase("order-ready");
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		}
	}, [orderId, refresh]);

	useEffect(() => {
		if (!orderId) return;
		if (
			phase === "completed" ||
			phase === "failed" ||
			phase === "timeout"
		) {
			return;
		}
		if (phase !== "awaiting-payment" && phase !== "awaiting-shipment") {
			return;
		}
		const initialRefresh = window.setTimeout(() => {
			refreshWithErrorHandling();
		}, 0);
		const timer = window.setInterval(() => {
			refreshWithErrorHandling();
		}, 2000);
		return () => {
			window.clearTimeout(initialRefresh);
			window.clearInterval(timer);
		};
	}, [orderId, phase, refreshWithErrorHandling]);

	useEffect(() => {
		if (!runStartedAt) return;
		if (phase !== "awaiting-payment" && phase !== "awaiting-shipment")
			return;
		const timer = window.setInterval(() => {
			const now = Date.now();
			setNowTick(now);
			if (now - runStartedAt >= 60000) {
				setPhase("timeout");
			}
		}, 500);
		return () => {
			window.clearInterval(timer);
		};
	}, [phase, runStartedAt]);

	const handleSelectStep = useCallback(
		(nextIndex: number) => {
			const lastIndex = STEPS.length - 1;
			if (
				nextIndex > lastIndex &&
				previewIndex === lastIndex &&
				apiStatuses["shipment"] === "succeeded"
			) {
				setCompletedUntil(lastIndex);
				setCompletionAcknowledged(true);
				setShowCompletionSummary(true);
				if (orderId) {
					refreshWithErrorHandling();
				}
				return;
			}

			const bounded = Math.max(0, Math.min(maxNavigableIndex, nextIndex));
			setCompletedUntil((prev) => Math.max(prev, bounded - 1));
			setPreviewIndex(bounded);
			setShowCompletionSummary(false);
			if (orderId) {
				refreshWithErrorHandling();
			}
		},
		[
			apiStatuses,
			maxNavigableIndex,
			orderId,
			previewIndex,
			refreshWithErrorHandling,
		],
	);

	const handlePrevStep = useCallback(() => {
		if (showCompletionSummary) {
			setShowCompletionSummary(false);
			setPreviewIndex(STEPS.length - 1);
			return;
		}
		handleSelectStep(previewIndex - 1);
	}, [handleSelectStep, previewIndex, showCompletionSummary]);

	const handleNextStep = useCallback(() => {
		handleSelectStep(previewIndex + 1);
	}, [handleSelectStep, previewIndex]);

	return {
		users,
		inventoryItems,
		selectedUserId,
		selectedSku,
		inputLoading,
		phase,
		orderId,
		paymentId,
		outboxId,
		delaySeconds,
		order,
		payment,
		shipment,
		error,
		previewIndex,
		showCompletionSummary,
		statuses,
		apiStatuses,
		previewStep,
		previewApiStatus,
		previewLabStatus,
		canCreatePayment,
		canAcknowledgeCompletion,
		displayPhaseLabel,
		timeoutRemaining,
		isPolling,
		selectedUser,
		selectedItem,
		setSelectedUserId,
		setSelectedSku,
		handleCreateOrder,
		handleCreatePaymentIntent,
		refreshWithErrorHandling,
		handleSelectStep,
		handlePrevStep,
		handleNextStep,
	};
};
