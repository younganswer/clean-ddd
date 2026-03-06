/**
 * Generated schema fragment for CreateCheckoutBffRequest.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type CreateCheckoutBffRequest = {
            /** Format: uuid */
            userId: string;
            amount: number;
            currency: string;
            items?: components["schemas"]["OrderItem"][];
            /** @enum {string} */
            simulateOutcome?: "SUCCEEDED" | "FAILED";
            simulateDelaySeconds?: number;
        };
