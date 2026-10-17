import React from "react";
import type { Action } from "./Action";
import type { Column } from "./Column";

export interface GenericTableProps {
	data: Record<string, any>[];
	columns: Column[];
	actions: Action[];
	onAction: (name: string, item: Record<string, any>) => void;
	renderCell?: (key: string, item: Record<string, any>) => React.ReactNode;
	rowClassName?: (item: Record<string, any>) => string;
}
