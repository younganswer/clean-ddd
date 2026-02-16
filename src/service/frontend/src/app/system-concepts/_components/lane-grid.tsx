import { StatusPill } from "@/app/_components/status-pill";
import {
	LAYER_LABEL,
	LAYER_ORDER,
	normalizeStatus,
	type Layer,
	type StepDef,
	type StepStatus,
} from "@/app/system-concepts/_lib/system-concepts";

type LaneSteps = Record<Layer, StepDef[]>;

type Props = {
	laneSteps: LaneSteps;
	statuses: Record<string, StepStatus>;
	apiStatuses: Record<string, StepStatus>;
	previewIndex: number;
	showCompletionSummary: boolean;
	onSelectStep: (index: number) => void;
};

export function LaneGrid(props: Props) {
	const {
		laneSteps,
		statuses,
		apiStatuses,
		previewIndex,
		showCompletionSummary,
		onSelectStep,
	} = props;

	return (
		<section className="grid gap-3 lg:grid-cols-4">
			{LAYER_ORDER.map((layer) => (
				<div key={layer} className="surface p-4">
					<div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						{LAYER_LABEL[layer]}
					</div>
					<div className="grid gap-2">
						{laneSteps[layer].map((step) => {
							const status = statuses[step.id] ?? "pending";
							const apiStatus = apiStatuses[step.id] ?? "pending";
							const stepIndex = step.order - 1;
							const isCurrent =
								!showCompletionSummary &&
								previewIndex === stepIndex;
							return (
								<button
									type="button"
									key={step.id}
									onClick={() => onSelectStep(stepIndex)}
									className={`surface-muted p-3 text-left ${isCurrent ? "ring-2 ring-ring" : ""}`}
								>
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs font-medium">
											#{step.order}
										</span>
										<StatusPill
											status={normalizeStatus(status)}
										/>
									</div>
									<div className="mt-1 text-[11px] text-muted-foreground">
										API: {normalizeStatus(apiStatus)}
									</div>
									<div className="mt-1 text-sm font-medium">
										{step.label}
									</div>
									<div className="mt-1 text-xs text-muted-foreground">
										{step.method}
									</div>
									{step.inferred && (
										<div className="mt-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
											Inferred
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>
			))}
		</section>
	);
}
