/**
 * Generated schema fragment for OrderEnvelope.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type OrderEnvelope = components["schemas"]["SuccessEnvelope"] & {
            data: components["schemas"]["Order"];
        };
