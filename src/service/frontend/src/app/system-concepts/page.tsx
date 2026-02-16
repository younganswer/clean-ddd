"use client";

import { useMemo } from "react";
import { ControlPanel } from "@/app/system-concepts/_components/control-panel";
import { StepPreview } from "@/app/system-concepts/_components/step-preview";
import { LaneGrid } from "@/app/system-concepts/_components/lane-grid";
import { DocLinks } from "@/app/system-concepts/_components/doc-links";
import { useSystemConceptsLab } from "@/app/system-concepts/_hooks/use-system-concepts-lab";
import {
	DOC_LINKS,
	STEPS,
	buildLaneSteps,
} from "@/app/system-concepts/_lib/system-concepts";

const SystemConceptsPage = () => {
	const {
		users,
		inventoryItems,
		selectedUserId,
		selectedSku,
		inputLoading,
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
	} = useSystemConceptsLab();

	const laneSteps = useMemo(() => buildLaneSteps(), []);

	return (
		<div className="page-shell grid gap-6">
			<ControlPanel
				displayPhaseLabel={displayPhaseLabel}
				isPolling={isPolling}
				inputLoading={inputLoading}
				users={users}
				inventoryItems={inventoryItems}
				selectedUserId={selectedUserId}
				selectedSku={selectedSku}
				selectedUserDisplayName={selectedUser?.displayName ?? ""}
				selectedItemSku={selectedItem?.sku ?? ""}
				orderId={orderId}
				paymentId={paymentId}
				outboxId={outboxId}
				delaySeconds={delaySeconds}
				order={order}
				payment={payment}
				shipment={shipment}
				timeoutRemaining={timeoutRemaining}
				error={error}
				canCreatePayment={canCreatePayment}
				onSelectedUserIdChange={setSelectedUserId}
				onSelectedSkuChange={setSelectedSku}
				onCreateOrder={() => void handleCreateOrder()}
				onCreatePaymentIntent={() => void handleCreatePaymentIntent()}
				onRefresh={refreshWithErrorHandling}
			/>

			<StepPreview
				showCompletionSummary={showCompletionSummary}
				previewIndex={previewIndex}
				stepsCount={STEPS.length}
				canAcknowledgeCompletion={canAcknowledgeCompletion}
				previewStep={previewStep}
				previewLabStatus={previewLabStatus}
				previewApiStatus={previewApiStatus}
				orderId={orderId}
				paymentId={paymentId}
				outboxId={outboxId}
				shipmentId={shipment?.shipmentId ?? ""}
				onPrev={handlePrevStep}
				onNext={handleNextStep}
			/>

			<LaneGrid
				laneSteps={laneSteps}
				statuses={statuses}
				apiStatuses={apiStatuses}
				previewIndex={previewIndex}
				showCompletionSummary={showCompletionSummary}
				onSelectStep={handleSelectStep}
			/>

			<DocLinks docs={DOC_LINKS} />
		</div>
	);
};
export default SystemConceptsPage;
