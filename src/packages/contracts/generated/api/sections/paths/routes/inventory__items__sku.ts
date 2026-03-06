/**
 * Generated path fragment for /inventory/items/{sku}.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type ApiInventoryItemsSkuPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get inventory item by sku */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    sku: string;
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
                        "application/json": components["schemas"]["InventoryItemNullableEnvelope"];
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
