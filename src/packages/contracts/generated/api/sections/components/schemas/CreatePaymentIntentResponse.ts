/**
 * Generated schema fragment for CreatePaymentIntentResponse.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type CreatePaymentIntentResponse = {
            paymentId: string;
            /** @enum {string} */
            status: "PENDING" | "SUCCEEDED" | "FAILED";
            scheduled: {
                eventType: string;
                delaySeconds: number;
                outboxId: string;
            };
        };
