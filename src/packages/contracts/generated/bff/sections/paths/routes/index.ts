/**
 * Generated path route index.
 * Do not make direct changes to generated output.
 */

import type { BffBffDashboardSummaryPath } from "./bff__dashboard__summary";
import type { BffBffOrdersPath } from "./bff__orders";
import type { BffBffOrdersOrderIdPath } from "./bff__orders__orderId";
import type { BffBffOrderDetailOrderIdPath } from "./bff__order-detail__orderId";
import type { BffBffCheckoutPath } from "./bff__checkout";
import type { BffBffGraphPath } from "./bff__graph";
import type { BffBffSystemConceptsBootstrapPath } from "./bff__system-concepts__bootstrap";

export interface GeneratedPathEntries {
    "/bff/dashboard/summary": BffBffDashboardSummaryPath;
    "/bff/orders": BffBffOrdersPath;
    "/bff/orders/{orderId}": BffBffOrdersOrderIdPath;
    "/bff/order-detail/{orderId}": BffBffOrderDetailOrderIdPath;
    "/bff/checkout": BffBffCheckoutPath;
    "/bff/graph": BffBffGraphPath;
    "/bff/system-concepts/bootstrap": BffBffSystemConceptsBootstrapPath;
}
