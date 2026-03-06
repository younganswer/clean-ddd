/**
 * Generated path fragment for /shipments/by-order/{orderId}.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type ApiShipmentsByOrderOrderIdPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get shipment by order id */
        get: {
            parameters: {
                query?: never;
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
                        "application/json": components["schemas"]["ShipmentSummaryNullableEnvelope"];
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
