import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import type { OrderView } from '@/shared/ordering/readers/order.view';
import { ListOrdersByUserIdQuery } from '@/shared/ordering/queries/list-orders-by-user-subject-id.query';

import { GetShipmentQuery } from '@/shared/shipping/queries/get-shipment.query';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import { GetShipmentByOrderQuery } from '@/shared/shipping/queries/get-shipment-by-order.query';

import { GetPaymentIntentQuery } from '@/shared/payments/queries/get-payment-intent.query';
import type { PaymentIntentView } from '@/shared/readers/payments/dto/payment-intent.view';

import { GetUserProfileQuery } from '@/shared/users/queries/get-user-profile.query';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';

import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';

import {
	GetGraphBffQuery,
	type GraphEdge,
	type GraphNode,
	type GraphRootType,
	type GraphView,
} from '@/bff/graph/application/queries/get-graph-bff.query';

type EntityRef = { type: GraphRootType; id: string };

const clampInt = (
	value: unknown,
	min: number,
	max: number,
	fallback: number,
): number => {
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.trunc(n)));
};

const isDefinedNumber = (value: unknown): value is number => {
	return typeof value === 'number' && Number.isFinite(value);
};

const nodeId = (type: string, key: string): string => {
	return `${type}:${key}`;
};

const normalizeId = (value: unknown): string => {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value).trim();
	if (typeof value === 'bigint') return String(value).trim();
	if (typeof value === 'boolean') return String(value).trim();
	return '';
};

@QueryHandler(GetGraphBffQuery)
@Injectable()
export class GetGraphBffHandler implements IQueryHandler<GetGraphBffQuery> {
	constructor(
		private readonly queryBus: QueryBus,
		private readonly em: EntityManager,
	) {}

	async execute(query: GetGraphBffQuery): Promise<GraphView | null> {
		const rootType = query.input.rootType;
		const rootId = normalizeId(query.input.rootId);
		if (!rootId) return null;

		const rootNodeId = nodeId(rootType, rootId);

		const maxDepth = clampInt(query.input.depth, 0, 4, 2);

		const defaultMaxNodesByDepth: Record<number, number> = {
			0: 50,
			1: 250,
			2: 600,
			3: 900,
			4: 1200,
		};
		const defaultMaxEventsByDepth: Record<number, number> = {
			0: 0,
			1: 200,
			2: 500,
			3: 800,
			4: 1200,
		};

		const maxNodes = isDefinedNumber(query.input.maxNodes)
			? clampInt(query.input.maxNodes, 1, 2000, 600)
			: clampInt(defaultMaxNodesByDepth[maxDepth] ?? 600, 1, 2000, 600);

		const maxEvents = isDefinedNumber(query.input.maxEvents)
			? clampInt(query.input.maxEvents, 0, 2000, 500)
			: clampInt(defaultMaxEventsByDepth[maxDepth] ?? 500, 0, 2000, 500);
		const includeEvents = query.input.includeEvents ?? true;
		let truncated = false;

		const nodes = new Map<string, GraphNode>();
		const edges = new Map<string, GraphEdge>();

		const knownUsers = new Set<string>();
		const knownOrders = new Set<string>();
		const knownShipments = new Set<string>();
		const knownPayments = new Set<string>();

		const userProfileCache = new Map<string, UserProfileView>();

		const userToOrderIds = new Map<string, Set<string>>();
		const orderToShipmentId = new Map<string, string>();

		const orderToPaymentId = new Map<string, string>();
		const paymentToOrderId = new Map<string, string>();

		const enqueue: Array<{ ref: EntityRef; depth: number }> = [
			{ ref: { type: rootType, id: rootId }, depth: 0 },
		];

		const visited = new Set<string>();

		const addNode = (node: GraphNode): void => {
			if (nodes.has(node.id)) return;
			if (nodes.size >= maxNodes && node.id !== rootNodeId) {
				truncated = true;
				return;
			}
			nodes.set(node.id, node);
		};

		const addEdge = (edge: Omit<GraphEdge, 'id'>): void => {
			const id = `${edge.from}--${edge.type}-->${edge.to}`;
			if (!edges.has(id)) edges.set(id, { id, ...edge });
		};

		const addUser = (userId: string): void => {
			const normalized = normalizeId(userId);
			if (!normalized) return;
			if (knownUsers.has(normalized)) return;
			knownUsers.add(normalized);
			addNode({
				id: nodeId('USER', normalized),
				type: 'USER',
				label: normalized,
			});
		};

		const upsertUserProfile = (profile: UserProfileView): void => {
			const userId = normalizeId(profile.userId);
			if (!userId) return;

			const id = nodeId('USER', userId);
			const existing = nodes.get(id);
			const displayName = normalizeId(profile.displayName);
			const email = normalizeId(profile.email);
			const label = displayName || email || userId;

			// Update label/data even if the node was already added as a placeholder.
			nodes.set(id, {
				...(existing ?? {
					id,
					type: 'USER',
					label: userId,
					data: {},
				}),
				id,
				type: 'USER',
				label,
				data: {
					...(existing?.data ?? {}),
					userId,
					displayName: displayName || null,
					email: email || null,
					avatarUrl: profile.avatarUrl ?? null,
				},
			});

			// Ensure bookkeeping remains consistent.
			knownUsers.add(userId);
		};

		const fetchUserProfile = async (
			userId: string,
		): Promise<UserProfileView | null> => {
			const id = normalizeId(userId);
			if (!id) return null;
			const cached = userProfileCache.get(id);
			if (cached) return cached;

			const profile = await this.queryBus.execute<
				GetUserProfileQuery,
				UserProfileView
			>(new GetUserProfileQuery(id));

			userProfileCache.set(id, profile);
			return profile;
		};

		const addOrder = (order: OrderView): void => {
			const id = normalizeId(order.orderId);
			if (!id) return;
			if (knownOrders.has(id)) return;
			knownOrders.add(id);

			const userId = normalizeId(
				(order as unknown as { userId?: string }).userId,
			);

			addNode({
				id: nodeId('ORDER', id),
				type: 'ORDER',
				label: id,
				data: {
					status: order.status,
					amount: order.amount,
					currency: order.currency,
					userId: userId || null,
					paymentId: order.paymentId,
				},
			});
			if (userId) {
				addUser(userId);
				addEdge({
					from: nodeId('USER', userId),
					to: nodeId('ORDER', id),
					type: 'OWNS',
					label: 'userId',
				});

				const set = userToOrderIds.get(userId) ?? new Set<string>();
				set.add(id);
				userToOrderIds.set(userId, set);
			}

			const pid = normalizeId(order.paymentId);
			if (pid) orderToPaymentId.set(id, pid);
		};

		const addShipment = (shipment: ShipmentView): void => {
			const sid = normalizeId(shipment.shipmentId);
			const oid = normalizeId(shipment.orderId);
			if (!sid) return;
			if (knownShipments.has(sid)) return;
			knownShipments.add(sid);
			addNode({
				id: nodeId('SHIPMENT', sid),
				type: 'SHIPMENT',
				label: sid,
				data: {
					status: shipment.status,
					orderId: shipment.orderId,
				},
			});

			if (oid) {
				orderToShipmentId.set(oid, sid);
				addEdge({
					from: nodeId('ORDER', oid),
					to: nodeId('SHIPMENT', sid),
					type: 'REFERENCES',
					label: 'orderId',
				});
			}
		};

		const addPayment = (payment: PaymentIntentView): void => {
			const pid = normalizeId(payment.paymentId);
			const oid = normalizeId(payment.orderId);
			if (!pid) return;
			if (knownPayments.has(pid)) return;
			knownPayments.add(pid);
			addNode({
				id: nodeId('PAYMENT', pid),
				type: 'PAYMENT',
				label: pid,
				data: {
					status: payment.status,
					amount: payment.amount,
					currency: payment.currency,
					orderId: payment.orderId,
				},
			});

			if (oid) paymentToOrderId.set(pid, oid);
		};

		const fetchOrder = async (
			orderId: string,
		): Promise<OrderView | null> => {
			const id = normalizeId(orderId);
			if (!id) return null;
			return await this.queryBus.execute<GetOrderQuery, OrderView | null>(
				new GetOrderQuery(id),
			);
		};

		const fetchShipmentById = async (
			shipmentId: string,
		): Promise<ShipmentView | null> => {
			const id = normalizeId(shipmentId);
			if (!id) return null;
			return await this.queryBus.execute<
				GetShipmentQuery,
				ShipmentView | null
			>(new GetShipmentQuery(id));
		};

		const fetchShipmentByOrderId = async (
			orderId: string,
		): Promise<ShipmentView | null> => {
			const id = normalizeId(orderId);
			if (!id) return null;
			return await this.queryBus.execute<
				GetShipmentByOrderQuery,
				ShipmentView | null
			>(new GetShipmentByOrderQuery(id));
		};

		const fetchPayment = async (
			paymentId: string,
		): Promise<PaymentIntentView | null> => {
			const id = normalizeId(paymentId);
			if (!id) return null;
			return await this.queryBus.execute<
				GetPaymentIntentQuery,
				PaymentIntentView | null
			>(new GetPaymentIntentQuery(id));
		};

		const expandEntity = async (ref: EntityRef): Promise<void> => {
			switch (ref.type) {
				case 'USER': {
					const userId = normalizeId(ref.id);
					if (!userId) return;
					addUser(userId);

					// Enrich user node with displayName/email so the graph UI can show something useful.
					try {
						const profile = await fetchUserProfile(userId);
						if (profile) upsertUserProfile(profile);
					} catch {
						// ignore (fallback label=userId)
					}

					const list = await this.queryBus.execute<
						ListOrdersByUserIdQuery,
						OrderView[]
					>(new ListOrdersByUserIdQuery(userId, 200, 0));

					for (const o of list) addOrder(o);
					return;
				}
				case 'ORDER': {
					const order = await fetchOrder(ref.id);
					if (!order) return;
					addOrder(order);

					const [shipment, payment] = await Promise.all([
						fetchShipmentByOrderId(order.orderId),
						order.paymentId
							? fetchPayment(order.paymentId)
							: Promise.resolve(null),
					]);

					if (shipment) addShipment(shipment);
					if (payment) addPayment(payment);
					return;
				}
				case 'SHIPMENT': {
					const shipment = await fetchShipmentById(ref.id);
					if (!shipment) return;
					addShipment(shipment);

					const order = await fetchOrder(shipment.orderId);
					if (order) addOrder(order);
					return;
				}
				case 'PAYMENT': {
					const payment = await fetchPayment(ref.id);
					if (!payment) return;
					addPayment(payment);

					const order = await fetchOrder(payment.orderId);
					if (order) addOrder(order);
					return;
				}
				default:
					return;
			}
		};

		// BFS over entities (weak relations only)
		while (enqueue.length > 0) {
			if (nodes.size >= maxNodes) {
				truncated = true;
				break;
			}
			const item = enqueue.shift()!;
			const visitKey = nodeId(item.ref.type, item.ref.id);
			if (visited.has(visitKey)) continue;
			visited.add(visitKey);

			await expandEntity(item.ref);

			if (item.depth >= maxDepth) continue;

			// enqueue neighbors discovered so far
			if (item.ref.type === 'USER') {
				const userId = normalizeId(item.ref.id);
				const orderIds = userToOrderIds.get(userId);
				if (orderIds) {
					for (const oid of orderIds) {
						enqueue.push({
							ref: { type: 'ORDER', id: oid },
							depth: item.depth + 1,
						});
					}
				}
			}

			if (item.ref.type === 'ORDER') {
				const orderNode = nodes.get(nodeId('ORDER', item.ref.id));
				const data = orderNode?.data;
				const userId =
					typeof data?.userId === 'string' ? data.userId : null;
				const paymentId = (() => {
					const fromMap = orderToPaymentId.get(
						normalizeId(item.ref.id),
					);
					if (fromMap) return fromMap;
					return typeof data?.paymentId === 'string'
						? data.paymentId
						: null;
				})();

				if (userId) {
					enqueue.push({
						ref: { type: 'USER', id: userId },
						depth: item.depth + 1,
					});
				}

				const oid = normalizeId(item.ref.id);
				const cachedShipmentId = oid
					? orderToShipmentId.get(oid)
					: undefined;
				if (cachedShipmentId) {
					enqueue.push({
						ref: { type: 'SHIPMENT', id: cachedShipmentId },
						depth: item.depth + 1,
					});
				} else {
					const shipment = await fetchShipmentByOrderId(item.ref.id);
					if (shipment) {
						addShipment(shipment);
						enqueue.push({
							ref: { type: 'SHIPMENT', id: shipment.shipmentId },
							depth: item.depth + 1,
						});
					}
				}

				if (paymentId) {
					enqueue.push({
						ref: { type: 'PAYMENT', id: paymentId },
						depth: item.depth + 1,
					});
				}
			}

			if (item.ref.type === 'SHIPMENT') {
				const shipmentNode = nodes.get(nodeId('SHIPMENT', item.ref.id));
				const data = shipmentNode?.data;
				const orderId =
					typeof data?.orderId === 'string' ? data.orderId : null;
				if (orderId)
					enqueue.push({
						ref: { type: 'ORDER', id: orderId },
						depth: item.depth + 1,
					});
			}

			if (item.ref.type === 'PAYMENT') {
				const paymentNode = nodes.get(nodeId('PAYMENT', item.ref.id));
				const data = paymentNode?.data;
				const orderId =
					typeof data?.orderId === 'string' ? data.orderId : null;
				if (orderId)
					enqueue.push({
						ref: { type: 'ORDER', id: orderId },
						depth: item.depth + 1,
					});
			}
		}

		// Reconcile ORDER<->PAYMENT 1:1 edges.
		// We intentionally emit a single edge per pair to avoid N:M-looking graphs when
		// the two weak keys (order.paymentId vs payment.orderId) disagree.
		const paymentsByOrderId = new Map<string, string[]>();
		for (const [pid, oid] of paymentToOrderId.entries()) {
			const list = paymentsByOrderId.get(oid) ?? [];
			list.push(pid);
			paymentsByOrderId.set(oid, list);
		}
		for (const list of paymentsByOrderId.values()) list.sort();

		const linkedOrders = new Set<string>();
		const linkedPayments = new Set<string>();

		const tryLink = (orderId: string, paymentId: string, label: string) => {
			if (!knownOrders.has(orderId)) return;
			if (!knownPayments.has(paymentId)) return;
			if (linkedOrders.has(orderId)) return;
			if (linkedPayments.has(paymentId)) return;
			linkedOrders.add(orderId);
			linkedPayments.add(paymentId);
			addEdge({
				from: nodeId('ORDER', orderId),
				to: nodeId('PAYMENT', paymentId),
				type: 'REFERENCES',
				label,
			});
		};

		for (const oid of knownOrders) {
			const byOrderPaymentId = orderToPaymentId.get(oid);
			if (
				byOrderPaymentId &&
				paymentToOrderId.get(byOrderPaymentId) === oid &&
				knownPayments.has(byOrderPaymentId)
			) {
				tryLink(oid, byOrderPaymentId, 'paymentId');
			}
		}

		for (const oid of knownOrders) {
			if (linkedOrders.has(oid)) continue;
			const pids = paymentsByOrderId.get(oid);
			const pid = pids?.[0];
			if (pid) tryLink(oid, pid, 'orderId');
		}

		for (const oid of knownOrders) {
			if (linkedOrders.has(oid)) continue;
			const pid = orderToPaymentId.get(oid);
			if (pid) tryLink(oid, pid, 'paymentId');
		}

		// if root entity was not found, return null
		if (!nodes.has(rootNodeId)) return null;

		// EVENT nodes (Outbox). Inventory events are excluded.
		if (
			includeEvents &&
			maxDepth > 0 &&
			maxEvents > 0 &&
			nodes.size < maxNodes
		) {
			const orderIds = new Set(knownOrders);
			const paymentIds = new Set(knownPayments);

			const recent = await this.em.find(
				OutboxEventSchema,
				{},
				{
					limit: maxEvents,
					orderBy: { createdAt: 'desc' },
				},
			);

			for (const row of recent) {
				const eventType = String(row.eventType ?? '');
				if (eventType.startsWith('INVENTORY.')) continue;

				const payload = row.payload ?? {};
				const orderId =
					typeof payload.orderId === 'string'
						? payload.orderId
						: null;
				const paymentId =
					typeof payload.paymentId === 'string'
						? payload.paymentId
						: null;

				const matches =
					(orderId && orderIds.has(orderId)) ||
					(paymentId && paymentIds.has(paymentId));
				if (!matches) continue;

				const eid = row.uuid;
				const eventNodeId = nodeId('EVENT', eid);
				addNode({
					id: eventNodeId,
					type: 'EVENT',
					label: eventType,
					data: {
						eventType,
						payload,
						createdAt:
							row.createdAt?.toISOString?.() ??
							String(row.createdAt),
						status: row.status,
					},
				});

				if (orderId && orderIds.has(orderId)) {
					addEdge({
						from: nodeId('ORDER', orderId),
						to: eventNodeId,
						type: 'EMITS',
						label: 'orderId',
					});
				}

				if (paymentId && paymentIds.has(paymentId)) {
					addEdge({
						from: nodeId('PAYMENT', paymentId),
						to: eventNodeId,
						type: 'EMITS',
						label: 'paymentId',
					});
				}
			}
		}

		const nodeIds = new Set(nodes.keys());
		const finalEdges = Array.from(edges.values()).filter(
			(e) => nodeIds.has(e.from) && nodeIds.has(e.to),
		);

		// Enforce maxDepth on the final graph.
		// Note: During expansion we may add nodes opportunistically (e.g. ORDER -> PAYMENT)
		// even when the caller requested a smaller depth. To make depth behavior intuitive,
		// prune nodes/edges based on actual shortest-path distance from the root.
		if (maxDepth >= 0) {
			const adjacency = new Map<string, Set<string>>();
			const addAdj = (a: string, b: string) => {
				const set = adjacency.get(a) ?? new Set<string>();
				set.add(b);
				adjacency.set(a, set);
			};

			for (const e of finalEdges) {
				// Treat graph depth as undirected hop distance for UX.
				addAdj(e.from, e.to);
				addAdj(e.to, e.from);
			}

			const dist = new Map<string, number>();
			const q: string[] = [];
			dist.set(rootNodeId, 0);
			q.push(rootNodeId);

			while (q.length > 0) {
				const cur = q.shift()!;
				const d = dist.get(cur)!;
				if (d >= maxDepth) continue;
				const nexts = adjacency.get(cur);
				if (!nexts) continue;
				for (const nxt of nexts) {
					if (dist.has(nxt)) continue;
					dist.set(nxt, d + 1);
					q.push(nxt);
				}
			}

			const allowedNodeIds = new Set(
				Array.from(dist.entries())
					.filter(([, d]) => d <= maxDepth)
					.map(([id]) => id),
			);
			// Ensure root is always included.
			allowedNodeIds.add(rootNodeId);

			const prunedNodes = Array.from(nodes.values()).filter((n) =>
				allowedNodeIds.has(n.id),
			);
			const prunedEdges = finalEdges.filter(
				(e) => allowedNodeIds.has(e.from) && allowedNodeIds.has(e.to),
			);

			return {
				rootNodeId,
				nodes: prunedNodes,
				edges: prunedEdges,
				truncated: truncated || nodes.size >= maxNodes,
			};
		}

		return {
			rootNodeId,
			nodes: Array.from(nodes.values()),
			edges: finalEdges,
			truncated: truncated || nodes.size >= maxNodes,
		};
	}
}
