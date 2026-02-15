type Tone = "success" | "danger" | "warning" | "pending" | "neutral";

function getTone(status: string): Tone {
	const normalized = status.trim().toUpperCase();

	if (
		normalized.includes("FAILED") ||
		normalized.includes("ERROR") ||
		normalized.includes("CANCELED") ||
		normalized.includes("DECLINED")
	) {
		return "danger";
	}

	if (
		normalized.includes("SUCCEEDED") ||
		normalized.includes("COMPLETED") ||
		normalized.includes("DELIVERED") ||
		normalized.includes("PAID")
	) {
		return "success";
	}

	if (
		normalized.includes("PENDING") ||
		normalized.includes("PROCESSING") ||
		normalized.includes("CREATED") ||
		normalized.includes("WAIT")
	) {
		return "pending";
	}

	if (
		normalized.includes("SHIPP") ||
		normalized.includes("RESERVED") ||
		normalized.includes("IN_TRANSIT")
	) {
		return "warning";
	}

	return "neutral";
}

type StatusPillProps = {
	status: string | null | undefined;
};

export function StatusPill({ status }: StatusPillProps) {
	if (!status) {
		return <span className="status-pill status-neutral">-</span>;
	}

	const tone = getTone(status);
	return <span className={`status-pill status-${tone}`}>{status}</span>;
}
