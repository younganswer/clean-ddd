/**
 * Generated schema fragment for PaginatedInventoryItem.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type PaginatedInventoryItem = {
            items: components["schemas"]["InventoryItem"][];
            offset: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
        };
