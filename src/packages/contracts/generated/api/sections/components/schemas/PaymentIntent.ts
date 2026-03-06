/**
 * Generated schema fragment for PaymentIntent.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaymentIntent = {
            paymentId: string;
            orderId: string;
            amount: number;
            /** @enum {string} */
            currency: "KRW" | "USD";
            /** @enum {string} */
            status: "PENDING" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
