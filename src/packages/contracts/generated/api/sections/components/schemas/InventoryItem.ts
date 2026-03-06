/**
 * Generated schema fragment for InventoryItem.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type InventoryItem = {
            itemId: string;
            sku: string;
            price: components["schemas"]["Money"];
            availableQuantity: number;
            reservedQuantity: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
