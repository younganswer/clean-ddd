import Link from "next/link";

const HomePage = () => {
	return (
		<div className="page-shell grid gap-6">
			<section className="surface overflow-hidden p-6 lg:p-8">
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
					<div className="grid gap-3">
						<h1 className="text-3xl font-semibold tracking-tight">
							클린 아키텍처와 도메인 주도 설계
						</h1>
						{/* prettier-ignore */}
						<p className="max-w-2xl text-sm text-muted-foreground">
							이 프로젝트는 Clean Architecture + DDD 구조를 실행형 UI로 확인할 수 있는 데모 애플리케이션을 제공하는 것을 목표로 합니다.
							Graph 페이지에서는 객체 간 관계를, System Concepts 페이지에서는 주문부터 결제/배송까지의 처리 흐름을 단계별로 확인하실 수 있습니다.
							실제(데모) 데이터는 Users, Orders, Shipments, Inventory 페이지를 참고해주세요.
						</p>
					</div>

					<div className="surface-muted p-4">
						<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
							Routes
						</div>
						<div className="mt-3 grid gap-2 text-sm">
							<div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
								<span>Home</span>
								<span className="font-mono text-xs">/</span>
							</div>
							<div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
								<span>Graph</span>
								<span className="font-mono text-xs">
									/graph
								</span>
							</div>
							<div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
								<span>System Concepts</span>
								<span className="font-mono text-xs">
									/system-concepts
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-2">
				<article className="surface p-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
								Overview
							</div>
							<h2 className="mt-1 text-xl font-semibold">
								Graph
							</h2>
						</div>
						<span className="status-pill status-pending">
							관계 탐색
						</span>
					</div>
					<p className="mt-3 text-sm text-muted-foreground">
						USER, ORDER, PAYMENT, SHIPMENT, EVENT를 하나의 그래프로
						보고 연결 구조를 파악합니다.
					</p>
					<div className="mt-4 grid gap-2 text-sm">
						<div className="surface-muted grid gap-2 px-3 py-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
							<div className="font-semibold">
								언제 사용하나요?
							</div>
							<p className="text-muted-foreground">
								어떤 객체가 어떤 객체와 연결되는지 빠르게 확인할
								때
							</p>
						</div>
						<div className="surface-muted grid gap-2 px-3 py-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
							<div className="font-semibold">
								어떻게 시작하나요?
							</div>
							<p className="text-muted-foreground">
								RootType과 RootId를 입력하고 조회합니다
							</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Link
							className="btn btn-primary inline-flex h-10 items-center justify-center px-4"
							href="/graph"
						>
							Graph 열기
						</Link>
						<Link
							className="btn inline-flex h-10 items-center justify-center px-4"
							href="/graph?rootType=USER&rootId=00000000-0000-0000-0000-000000000001"
						>
							예시 데이터로 시작
						</Link>
					</div>
				</article>

				<article className="surface p-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
								Overview
							</div>
							<h2 className="mt-1 text-xl font-semibold">
								System Concepts
							</h2>
						</div>
						<span className="status-pill status-success">
							흐름 파악
						</span>
					</div>
					<p className="mt-3 text-sm text-muted-foreground">
						Order 생성부터 PaymentIntent, Outbox, Shipment까지를
						단계별로 시각화해 백엔드 레이어 흐름을 파악합니다.
					</p>
					<div className="mt-4 grid gap-2 text-sm">
						<div className="surface-muted grid gap-2 px-3 py-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
							<div className="font-semibold">
								언제 사용하나요?
							</div>
							<p className="text-muted-foreground">
								처리 단계와 상태 전이를 순서대로 파악할 때
							</p>
						</div>
						<div className="surface-muted grid gap-2 px-3 py-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
							<div className="font-semibold">
								어떻게 시작하나요?
							</div>
							<p className="text-muted-foreground">
								User와 Inventory를 고른 뒤 Create Order를
								실행합니다
							</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Link
							className="btn btn-primary inline-flex h-10 items-center justify-center px-4"
							href="/system-concepts"
						>
							System Concepts 열기
						</Link>
					</div>
				</article>
			</section>

			<section className="surface p-6">
				<h2 className="text-lg font-semibold">추천 사용 순서</h2>
				<div className="mt-4 grid gap-3 md:grid-cols-3">
					<div className="surface-muted p-4">
						<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
							Step 1
						</div>
						<div className="mt-1 text-sm font-semibold">
							Graph에서 연결 구조 파악
						</div>
					</div>
					<div className="surface-muted p-4">
						<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
							Step 2
						</div>
						<div className="mt-1 text-sm font-semibold">
							System Concepts로 실행 흐름 파악
						</div>
					</div>
					<div className="surface-muted p-4">
						<div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
							Step 3
						</div>
						<div className="mt-1 text-sm font-semibold">
							Bounded Context 목록에서 실제 데이터 확인
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default HomePage;
