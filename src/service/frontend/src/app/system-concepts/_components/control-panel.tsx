import { StatusPill } from "@/app/_components/status-pill";
import type {
	InventoryItem,
	OrderDetail,
	PaymentIntent,
	ShipmentSummary,
	UserProfile,
} from "@/lib/api";

type Props = {
	displayPhaseLabel: string;
	isPolling: boolean;
	inputLoading: boolean;
	users: UserProfile[];
	inventoryItems: InventoryItem[];
	selectedUserId: string;
	selectedSku: string;
	selectedUserDisplayName: string;
	selectedItemSku: string;
	orderId: string;
	paymentId: string;
	outboxId: string;
	delaySeconds: number | null;
	order: OrderDetail | null;
	payment: PaymentIntent | null;
	shipment: ShipmentSummary | null;
	timeoutRemaining: number | null;
	error: string | null;
	canCreatePayment: boolean;
	onSelectedUserIdChange: (value: string) => void;
	onSelectedSkuChange: (value: string) => void;
	onCreateOrder: () => void;
	onCreatePaymentIntent: () => void;
	onRefresh: () => void;
};

export const ControlPanel = (props: Props) => {
	const {
		displayPhaseLabel,
		isPolling,
		inputLoading,
		users,
		inventoryItems,
		selectedUserId,
		selectedSku,
		selectedUserDisplayName,
		selectedItemSku,
		orderId,
		paymentId,
		outboxId,
		delaySeconds,
		order,
		payment,
		shipment,
		timeoutRemaining,
		error,
		canCreatePayment,
		onSelectedUserIdChange,
		onSelectedSkuChange,
		onCreateOrder,
		onCreatePaymentIntent,
		onRefresh,
	} = props;

	return (
		<section className="surface p-6">
			<div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
				<div className="grid gap-1">
					<h1 className="text-2xl font-semibold">System Concepts</h1>
					<p className="text-sm text-muted-foreground">
						Learning Lab: PaymentIntent 생성이 백엔드 레이어를
						통과하는 전 과정을 시뮬레이션합니다.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<StatusPill status={displayPhaseLabel} />
					{isPolling && <StatusPill status="POLLING" />}
				</div>
			</div>

			<div className="mt-4 grid gap-3 lg:grid-cols-2">
				<label className="grid gap-1">
					<span className="field-label">User</span>
					<select
						className="input"
						value={selectedUserId}
						disabled={inputLoading || users.length === 0}
						onChange={(e) => onSelectedUserIdChange(e.target.value)}
					>
						{users.map((user) => (
							<option key={user.userId} value={user.userId}>
								{user.displayName} ({user.userId})
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-1">
					<span className="field-label">Inventory</span>
					<select
						className="input"
						value={selectedSku}
						disabled={inputLoading || inventoryItems.length === 0}
						onChange={(e) => onSelectedSkuChange(e.target.value)}
					>
						{inventoryItems.map((item) => (
							<option key={item.itemId} value={item.sku}>
								{item.sku} · {item.price.amountMinor}{" "}
								{item.price.currency} · stock{" "}
								{item.availableQuantity}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-2">
				<button
					className="btn btn-primary"
					disabled={
						inputLoading ||
						!selectedUserDisplayName ||
						!selectedItemSku
					}
					onClick={onCreateOrder}
				>
					1) Create Order
				</button>
				<button
					className="btn btn-primary"
					disabled={!canCreatePayment}
					onClick={onCreatePaymentIntent}
				>
					2) Create PaymentIntent
				</button>
				<button className="btn" disabled={!orderId} onClick={onRefresh}>
					Refresh
				</button>
			</div>

			<div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
				<div className="surface-muted p-3">
					orderId: {orderId || "-"}
				</div>
				<div className="surface-muted p-3">
					paymentId: {paymentId || "-"}
				</div>
				<div className="surface-muted p-3">
					outboxId: {outboxId || "-"}
				</div>
				<div className="surface-muted p-3">
					delaySeconds: {delaySeconds === null ? "-" : delaySeconds}
				</div>
			</div>

			<div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
				<div className="surface-muted p-3">
					selected.user: {selectedUserDisplayName || "-"}
				</div>
				<div className="surface-muted p-3">
					selected.sku: {selectedItemSku || "-"}
				</div>
				<div className="surface-muted p-3">
					order.status: {order?.status ?? "-"}
				</div>
				<div className="surface-muted p-3">
					payment.status: {payment?.status ?? "-"}
				</div>
				<div className="surface-muted p-3">
					shipment.status: {shipment?.status ?? "-"}
				</div>
				<div className="surface-muted p-3">
					timeout(60s):{" "}
					{timeoutRemaining === null
						? "-"
						: `${Math.ceil(timeoutRemaining / 1000)}s`}
				</div>
			</div>

			{error && <div className="mt-3 text-sm text-danger">{error}</div>}
		</section>
	);
};
