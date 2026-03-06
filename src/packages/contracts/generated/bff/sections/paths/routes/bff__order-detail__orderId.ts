/**
 * Generated path fragment for /bff/order-detail/{orderId}.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type BffBffOrderDetailOrderIdPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get order detail aggregate (BFF) */
        get: {
            parameters: {
                query?: {
                    includePayment?: boolean;
                    includeShipment?: boolean;
                    includeReservations?: boolean;
                };
                header?: never;
                path: {
                    orderId: string;
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
                        "application/json": components["schemas"]["OrderDetailEnvelope"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
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
