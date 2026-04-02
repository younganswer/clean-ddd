/**
 * Generated schema fragment for Graph.
 * Do not make manual changes to generated output.
 */

import type { components } from "../core";

export type Graph = {
            rootNodeId: string;
            nodes: components["schemas"]["GraphNode"][];
            edges: components["schemas"]["GraphEdge"][];
            truncated?: boolean;
        };
