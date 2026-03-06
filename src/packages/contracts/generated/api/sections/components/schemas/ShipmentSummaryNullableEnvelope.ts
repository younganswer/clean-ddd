/**
 * Generated schema fragment for ShipmentSummaryNullableEnvelope.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type ShipmentSummaryNullableEnvelope = components["schemas"]["SuccessEnvelope"] & {
            data: components["schemas"]["ShipmentSummary"] | null;
        };
