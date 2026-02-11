# System at a Glance

This document introduces the repository-level structure and the main runtime components.

## Repository layout

- `apps/backend`: NestJS backend. It can run in multiple roles (HTTP API, cron/scheduler, queue poller).
- `apps/frontend`: Next.js admin UI (static export).
- `packages/contracts`: API contracts (OpenAPI) and shared types for integration. Domain objects are not shared.
- `infra`: AWS infrastructure templates (SAM).
- `tools`: local tooling such as LocalStack bootstrap scripts.

## Core ideas (technical)

### HTTP and async coexist

The system has two main execution modes:

- HTTP request/response: API Gateway (prod) or local port listener (dev).
- Async processing: SQS FIFO queue, produced by an Outbox dispatcher and consumed by a worker.

### Outbox is the bridge

Outbox is used to persist “things to process later” in the database first, then dispatch messages to SQS.

## Where to go next

- Runtime shape and processes: [Runtime Topology](runtime-topology.md)
- End-to-end flows: [Data Flows](data-flows.md)
- Visual navigation: [Concept Map](concept-map.md)
