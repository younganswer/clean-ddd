/**
 * Generated schema fragment for PaginatedOrders.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type PaginatedOrders = components["schemas"]["PaginatedMeta"] & {
            items: components["schemas"]["OrderSummary"][];
        };
