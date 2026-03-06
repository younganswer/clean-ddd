/**
 * Generated schema fragment for PaymentIntentListEnvelope.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaymentIntentListEnvelope = components["schemas"]["SuccessEnvelope"] & {
            data: components["schemas"]["PaymentIntent"][];
        };
