/**
 * Generated path fragment for /me.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type ApiMePath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get my profile */
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Optional actor id used by sample AuthGuard */
                    "x-user-id"?: string;
                };
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
                        "application/json": components["schemas"]["UserProfileEnvelope"];
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
