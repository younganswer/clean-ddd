/**
 * Generated schema fragment for OrderDetail.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type OrderDetail = {
            order: components["schemas"]["Order"];
            paymentIntent: components["schemas"]["PaymentIntent"];
            shipment: components["schemas"]["Shipment"];
            reservations: components["schemas"]["InventoryReservation"][];
            partialErrors?: string[];
        };
