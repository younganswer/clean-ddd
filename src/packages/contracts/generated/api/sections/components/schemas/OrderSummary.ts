/**
 * Generated schema fragment for OrderSummary.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type OrderSummary = {
            orderId: string;
            userId: string;
            /** @enum {string} */
            status: "PENDING_PAYMENT" | "PAID" | "CANCELLED";
            amount: number;
            /** @enum {string} */
            currency: "KRW" | "USD";
            items: components["schemas"]["OrderItem"][];
            paymentId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
