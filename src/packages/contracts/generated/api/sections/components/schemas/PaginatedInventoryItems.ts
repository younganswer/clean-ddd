/**
 * Generated schema fragment for PaginatedInventoryItems.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaginatedInventoryItems = components["schemas"]["PaginatedMeta"] & {
            items: components["schemas"]["InventoryItem"][];
        };
