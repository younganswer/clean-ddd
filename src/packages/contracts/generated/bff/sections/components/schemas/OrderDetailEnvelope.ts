/**
 * Generated schema fragment for OrderDetailEnvelope.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type OrderDetailEnvelope = components["schemas"]["SuccessEnvelope"] & {
            data: components["schemas"]["OrderDetail"];
        };
