/**
 * Generated schema fragment for PaymentIntentEnvelope.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaymentIntentEnvelope = components["schemas"]["SuccessEnvelope"] & {
            data: components["schemas"]["PaymentIntent"];
        };
