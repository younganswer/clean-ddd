/**
 * Generated schema fragment for PaginatedUserProfile.
 * Do not make direct changes to generated output.
 */

import type { components } from "../core";

export type PaginatedUserProfile = {
            items: components["schemas"]["UserProfile"][];
            offset: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
        };
