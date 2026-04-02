/**
 * Generated schema fragment for CreateOrderBffRequest.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type CreateOrderBffRequest = {
            /** Format: uuid */
            userId: string;
            amount: number;
            currency: string;
            items?: components["schemas"]["OrderItem"][];
        };
