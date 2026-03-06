/**
 * Generated path fragment for /payments/intents/{paymentId}.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type ApiPaymentsIntentsPaymentIdPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get payment intent */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    paymentId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaymentIntentEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
