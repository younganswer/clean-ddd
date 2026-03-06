/**
 * Generated path fragment for /users.
 * Do not make direct changes to generated output.
 */

import type { components } from "../../components";

export type ApiUsersPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List users */
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    page?: number;
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
                        "application/json": components["schemas"]["PaginatedUserProfilesEnvelope"];
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
