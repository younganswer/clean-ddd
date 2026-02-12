declare module "react-cytoscapejs" {
	import type cytoscape from "cytoscape";
	import type React from "react";

	export type CytoscapeComponentProps = {
		elements?: cytoscape.ElementDefinition[];
		stylesheet?: cytoscape.StylesheetJson;
		style?: React.CSSProperties;
		className?: string;
		cy?: (cy: cytoscape.Core) => void;
	};

	const CytoscapeComponent: React.ComponentType<CytoscapeComponentProps>;
	export default CytoscapeComponent;
}

declare module "cytoscape-fcose" {
	import type cytoscape from "cytoscape";

	const extension: (cy: cytoscape.CytoscapeStatic) => void;
	export default extension;
}
