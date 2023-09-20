export const enum DeclaredItemType {
	ClassItem = "class",
	InterfaceItem = "interface",
	NamespaceItem = "namespace",
	MethodItem = "method",
	PropertyItem = "property",
	FunctionItem = "function",
	VariableItem = "variable",
	TypeItem = "type",
}

export type DeclaredItem = {
	type: DeclaredItemType;
	id: string;
	name: string;
	title: string;
	isStatic?: boolean;
	isProtected?: boolean;
	isReadonly?: boolean;
	isAbstract?: boolean;
	members?: string[];
	extendsNames?: string[];
	inherits?: string;
	signature?: string;
	abstract?: string;
	summary?: string;
	description?: string;
	notes?: string;
	examples?: string[];
	related?: string[];
	params?: string[];
	throws?: string[];
	returns?: string;
	parent?: string;
	isPage?: boolean;
	isDeprecated?: boolean;
	deprecation?: string;
	hideConstructor?: boolean;
};
