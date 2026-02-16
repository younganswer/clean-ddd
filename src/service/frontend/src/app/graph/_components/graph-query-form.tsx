import type { RootType } from "@/app/graph/_lib/graph-helpers";

type Props = {
	formRootType: RootType;
	formRootId: string;
	formDepth: string;
	formMaxEvents: string;
	formMaxNodes: string;
	formIncludeEvents: boolean;
	searchText: string;
	onFormRootTypeChange: (value: RootType) => void;
	onFormRootIdChange: (value: string) => void;
	onFormDepthChange: (value: string) => void;
	onFormMaxEventsChange: (value: string) => void;
	onFormMaxNodesChange: (value: string) => void;
	onFormIncludeEventsChange: (checked: boolean) => void;
	onSearchTextChange: (value: string) => void;
	onSubmit: () => void;
	onSelectAndCenter: () => void;
};

export const GraphQueryForm = ({
	formRootType,
	formRootId,
	formDepth,
	formMaxEvents,
	formMaxNodes,
	formIncludeEvents,
	searchText,
	onFormRootTypeChange,
	onFormRootIdChange,
	onFormDepthChange,
	onFormMaxEventsChange,
	onFormMaxNodesChange,
	onFormIncludeEventsChange,
	onSearchTextChange,
	onSubmit,
	onSelectAndCenter,
}: Props) => {
	return (
		<form
			className="surface mt-4 flex flex-wrap items-end gap-3 p-4 text-sm"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
		>
			<label className="grid gap-1">
				<span className="field-label">RootType</span>
				<select
					className="input"
					value={formRootType}
					onChange={(e) =>
						onFormRootTypeChange(e.target.value as RootType)
					}
				>
					<option value="USER">USER</option>
					<option value="ORDER">ORDER</option>
					<option value="PAYMENT">PAYMENT</option>
					<option value="SHIPMENT">SHIPMENT</option>
				</select>
			</label>

			<label className="grid gap-1">
				<span className="field-label">RootId</span>
				<input
					className="input h-10 w-full min-w-0 font-mono text-xs md:w-[340px]"
					value={formRootId}
					onChange={(e) => onFormRootIdChange(e.target.value)}
					placeholder="예: dummy-1 또는 주문/결제/배송 ID"
				/>
			</label>

			<label className="grid gap-1">
				<span className="field-label">Depth (0~4)</span>
				<input
					type="number"
					min={0}
					max={4}
					step={1}
					className="input w-full sm:w-20"
					value={formDepth}
					onChange={(e) => onFormDepthChange(e.target.value)}
				/>
			</label>

			<label className="grid gap-1">
				<span className="field-label">MaxEvents</span>
				<input
					className="input w-full sm:w-28"
					value={formMaxEvents}
					onChange={(e) => onFormMaxEventsChange(e.target.value)}
				/>
			</label>

			<label className="input flex items-center gap-2 px-3">
				<input
					type="checkbox"
					checked={formIncludeEvents}
					onChange={(e) =>
						onFormIncludeEventsChange(e.target.checked)
					}
				/>
				<span className="text-xs text-foreground">EVENT 포함</span>
			</label>

			<label className="grid gap-1">
				<span className="field-label">MaxNodes</span>
				<input
					className="input w-full sm:w-28"
					value={formMaxNodes}
					onChange={(e) => onFormMaxNodesChange(e.target.value)}
				/>
			</label>

			<button className="btn btn-primary h-10 px-4" type="submit">
				조회
			</button>

			<div className="flex w-full flex-wrap items-end gap-2 md:ml-auto md:w-auto">
				<label className="grid gap-1">
					<span className="field-label">노드 검색</span>
					<input
						className="input h-10 w-full min-w-0 md:w-[260px]"
						value={searchText}
						onChange={(e) => onSearchTextChange(e.target.value)}
						placeholder="id/label 일부 입력"
					/>
				</label>
				<button
					type="button"
					className="btn h-10"
					onClick={onSelectAndCenter}
				>
					선택/센터
				</button>
			</div>
		</form>
	);
};
