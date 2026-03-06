/**
 * Generated schema fragment for DashboardSummary.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type DashboardSummary = {
            orders: components["schemas"]["Order"][];
            paymentIntents: components["schemas"]["PaymentIntent"][];
            shipments: components["schemas"]["Shipment"][];
            inventoryItems: components["schemas"]["InventoryItem"][];
            partialErrors?: string[];
        };
