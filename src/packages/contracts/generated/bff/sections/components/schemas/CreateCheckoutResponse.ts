/**
 * Generated schema fragment for CreateCheckoutResponse.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type CreateCheckoutResponse = {
            orderId: string;
            payment: components["schemas"]["CreatePaymentIntentResponse"];
        };
