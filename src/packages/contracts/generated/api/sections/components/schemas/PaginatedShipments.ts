/**
 * Generated schema fragment for PaginatedShipments.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaginatedShipments = components["schemas"]["PaginatedMeta"] & {
            items: components["schemas"]["ShipmentSummary"][];
        };
