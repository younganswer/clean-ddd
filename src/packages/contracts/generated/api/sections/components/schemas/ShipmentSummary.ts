/**
 * Generated schema fragment for ShipmentSummary.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type ShipmentSummary = {
            shipmentId: string;
            orderId: string;
            /** @enum {string} */
            status: "PENDING" | "SHIPPED" | "DELIVERED";
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
