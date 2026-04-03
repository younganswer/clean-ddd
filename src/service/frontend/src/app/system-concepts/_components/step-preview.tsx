import { StatusPill } from "@/app/_components/status-pill";
import {
	LAYER_LABEL,
	LAYER_ORDER,
	normalizeStatus,
	type StepDef,
	type StepStatus,
} from "@/app/system-concepts/_lib/system-concepts";

type Props = {
	showCompletionSummary: boolean;
	previewIndex: number;
	stepsCount: number;
	canAcknowledgeCompletion: boolean;
	previewStep: StepDef;
	previewLabStatus: StepStatus;
	previewApiStatus: StepStatus;
	orderId: string;
	paymentId: string;
	outboxId: string;
	shipmentId: string;
	onPrev: () => void;
	onNext: () => void;
};

export const StepPreview = (props: Props) => {
	const {
		showCompletionSummary,
		previewIndex,
		stepsCount,
		canAcknowledgeCompletion,
		previewStep,
		previewLabStatus,
		previewApiStatus,
		orderId,
		paymentId,
		outboxId,
		shipmentId,
		onPrev,
		onNext,
	} = props;

	return (
		<section className="surface p-6">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-lg font-semibold">Step Preview</h2>
				<div className="flex items-center gap-2">
					<button
						className="btn"
						disabled={
							showCompletionSummary ? false : previewIndex <= 0
						}
						onClick={onPrev}
					>
						Prev
					</button>
					<button
						className="btn"
						disabled={
							showCompletionSummary ||
							(previewIndex >= stepsCount - 1 &&
								!canAcknowledgeCompletion)
						}
						onClick={onNext}
					>
						Next
					</button>
				</div>
			</div>

			{showCompletionSummary ? (
				<div className="mt-4 surface-muted p-4">
					<div className="text-xs text-muted-foreground">
						Execution Summary
					</div>
					<div className="mt-1 text-base font-semibold">
						PaymentIntent 파이프라인 전 과정이 완료되었습니다.
					</div>
					{/* prettier-ignore */}
					<p className="mt-2 text-sm text-muted-foreground">
						Order 생성부터 PaymentIntent 처리, Outbox/Saga, Shipment 생성까지 모든 스텝을 확인했습니다.
					</p>
					<div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
						<div className="surface p-3">
							orderId: {orderId || "-"}
						</div>
						<div className="surface p-3">
							paymentId: {paymentId || "-"}
						</div>
						<div className="surface p-3">
							outboxId: {outboxId || "-"}
						</div>
						<div className="surface p-3">
							shipmentId: {shipmentId || "-"}
						</div>
					</div>
				</div>
			) : (
				<div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
					<div className="surface-muted p-4">
						<div className="text-xs text-muted-foreground">
							Step #{previewStep.order} ·{" "}
							{LAYER_LABEL[previewStep.layer]}
						</div>
						<div className="mt-1 text-base font-semibold">
							{previewStep.label}
						</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{previewStep.method}
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							{previewStep.description}
						</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<StatusPill
								status={normalizeStatus(previewLabStatus)}
							/>
							<span className="status-pill status-neutral">
								API {normalizeStatus(previewApiStatus)}
							</span>
							{previewStep.inferred && (
								<span className="status-pill status-neutral">
									Inferred
								</span>
							)}
						</div>
					</div>

					<div className="surface-muted p-4">
						<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
							Data Movement
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
							{LAYER_ORDER.map((layer, index) => {
								const active =
									layer === previewStep.flow.from ||
									layer === previewStep.flow.to;
								return (
									<div
										key={layer}
										className="flex items-center gap-2"
									>
										<span
											className={`rounded-full border px-2 py-1 ${active ? "border-accent text-foreground" : "border-border text-muted-foreground"}`}
										>
											{LAYER_LABEL[layer]}
										</span>
										{index < LAYER_ORDER.length - 1 && (
											<span className="text-muted-foreground">
												→
											</span>
										)}
									</div>
								);
							})}
						</div>
						<div className="mt-3 text-xs text-muted-foreground">
							{LAYER_LABEL[previewStep.flow.from]} →{" "}
							{LAYER_LABEL[previewStep.flow.to]}
						</div>
						<div className="mt-1 text-sm">
							Payload:{" "}
							{previewStep.flow.payload.join(", ") || "-"}
						</div>
						<div className="mt-2 text-sm">
							DB Write:{" "}
							{previewStep.flow.db
								? `${previewStep.flow.db.table} (${previewStep.flow.db.write.join(", ")})`
								: "-"}
						</div>
						<div className="mt-1 text-sm">
							Response:{" "}
							{previewStep.flow.response?.join(", ") || "-"}
						</div>
					</div>
				</div>
			)}
		</section>
	);
};
