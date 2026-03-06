/**
 * Generated schema fragment for PaginatedOrder.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaginatedOrder = {
            items: components["schemas"]["Order"][];
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
        };
