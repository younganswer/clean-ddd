/**
 * Generated path fragment for /bff/graph.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type BffBffGraphPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get relationship graph (BFF) */
        get: {
            parameters: {
                query: {
                    rootType: "USER" | "ORDER" | "SHIPMENT" | "PAYMENT";
                    rootId: string;
                    depth?: number;
                    maxEvents?: number;
                    maxNodes?: number;
                    includeEvents?: boolean;
                };
                header?: never;
                path?: never;
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
                        "application/json": components["schemas"]["GraphEnvelope"];
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
