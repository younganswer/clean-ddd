/**
 * Generated schema fragment for CreateOrderRequest.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type CreateOrderRequest = {
            userId: string;
            amount: number;
            /** @enum {string} */
            currency: "KRW" | "USD";
            items?: components["schemas"]["OrderItem"][];
        };
