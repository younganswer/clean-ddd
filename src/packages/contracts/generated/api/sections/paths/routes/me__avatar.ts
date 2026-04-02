/**
 * Generated path fragment for /me/avatar.
 * Do not make manual changes to generated output.
 */

import type { components } from "../../components";

export type ApiMeAvatarPath = {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update my avatar */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateMyAvatarRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UpdateMyAvatarResponseEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
