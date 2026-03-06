/**
 * Generated schema fragment for CreatePaymentIntentResponse.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type CreatePaymentIntentResponse = {
            paymentId: string;
            status: string;
            scheduled: components["schemas"]["ScheduledPaymentEvent"];
        };
