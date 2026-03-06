/**
 * Generated schema fragment for Order.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type Order = {
            orderId: string;
            userId: string;
            status: string;
            amount: number;
            currency: string;
            items: components["schemas"]["OrderItem"][];
            paymentId: string | null;
        };
