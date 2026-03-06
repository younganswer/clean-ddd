/**
 * Generated schema fragment for ErrorEnvelope.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type ErrorEnvelope = components["schemas"]["SuccessEnvelope"] & {
            error: {
                code: string;
                message: string;
                details?: {
                    [key: string]: unknown;
                };
            };
        };
