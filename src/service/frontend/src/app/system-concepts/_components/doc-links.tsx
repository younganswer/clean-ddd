import Link from "next/link";

type LinkItem = {
	label: string;
	href: string;
};

type Props = {
	docs: LinkItem[];
};

export const DocLinks = ({ docs }: Props) => {
	return (
		<section className="surface p-6">
			<h2 className="text-lg font-semibold">Concept Docs</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				백엔드 설계 개념은 아래 문서에서 확인할 수 있습니다.
			</p>
			<div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
				{docs.map((doc) => (
					<Link
						key={doc.href}
						href={doc.href}
						target="_blank"
						rel="noopener noreferrer"
						className="surface-muted flex items-center justify-between px-3 py-2 text-sm"
					>
						<span>{doc.label}</span>
						<span className="text-xs text-muted-foreground">
							External
						</span>
					</Link>
				))}
			</div>
		</section>
	);
};
