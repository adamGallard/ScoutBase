/**
 * Lookup data for membership stages: code, label, and color.
 */
export const stages = [
	{ code: "have_a_go", label: "Have a Go", color: "#FBBF24", order: 1 },
	{ code: "member", label: "Member", color: "#3B82F6", order: 2 },
	{ code: "invested", label: "Invested", color: "#10B981", order: 3 },
	{ code: "linking", label: "Linking", color: "#8B5CF6", order: 4 },
	{ code: "retired", label: "Retired", color: "#6B7280", order: 5 }
];

/**
 * Lookup data for scout sections: code, label, color, and order.
 */
export const sections = [
	{ code: "joeys", label: "Joeys", color: "#B75312", order: 1, threshold: 8 },
	{ code: "cubs", label: "Cubs", color: "#FFC726", order: 2, threshold: 11 },
	{ code: "scouts", label: "Scouts", color: "#00AB39", order: 3, threshold: 15 },
	{ code: "venturers", label: "Venturers", color: "#9E1B34", order: 4, threshold: 18 },
	{ code: "rovers", label: "Rovers", color: "#DC241F", order: 5, threshold: 25 },
];

/**
 * Utility maps for quick lookup by code.
 */
export const stageMap = stages.reduce((map, item) => {
	map[item.code] = { label: item.label, color: item.color, order: item.order };
	return map;
}, {});

export const sectionMap = sections.reduce((map, item) => {
	map[item.code] = { label: item.label, color: item.color, order: item.order };
	return map;
}, {});
