/**
 * Generated schema fragment for InventoryItemNullableEnvelope.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type InventoryItemNullableEnvelope = components["schemas"]["SuccessEnvelope"] & {
            data: components["schemas"]["InventoryItem"] | null;
        };
