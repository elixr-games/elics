// Types.ts

// Copy and clone functions for basic value types
export const copyValue = <T>(src: T): T => src;
export const cloneValue = <T>(src: T): T => src;

// Copy and clone functions for arrays
export const copyArray = <T>(src: T[], dest?: T[]): T[] => {
	if (!src) {
		return src;
	}

	if (!dest) {
		return [...src];
	}

	dest.length = 0;
	src.forEach((item) => dest.push(item));

	return dest;
};

export const cloneArray = <T>(src: T[]): T[] => {
	return [...src];
};

// Copy and clone functions for JSON objects
export const copyJSON = <T>(src: T): T => JSON.parse(JSON.stringify(src));
export const cloneJSON = <T>(src: T): T => JSON.parse(JSON.stringify(src));

// Interface for copyable and clonable objects
interface CopyableClonable<T> {
	copy: (src: T) => T;
	clone: () => T;
}

// Copy and clone functions for copyable and clonable objects
export const copyCopyable = <T extends CopyableClonable<T>>(
	src: T,
	dest?: T,
): T => {
	if (!src) {
		return src;
	}

	if (!dest) {
		return src.clone();
	}

	return dest.copy(src);
};

export const cloneClonable = <T extends CopyableClonable<T>>(
	src: T,
): T | undefined => src && src.clone();

// Type definition structure
export interface TypeDefinition<T> {
	name: string;
	default: T;
	copy: (src: T, dest?: T) => T;
	clone: (src: T) => T;
	isType?: boolean;
}

// Function to create a new type definition
export function createType<T>(
	typeDefinition: TypeDefinition<T>,
): TypeDefinition<T> {
	const mandatoryProperties: (keyof TypeDefinition<T>)[] = [
		'name',
		'default',
		'copy',
		'clone',
	];

	const undefinedProperties = mandatoryProperties.filter(
		(p) => !typeDefinition.hasOwnProperty(p),
	);

	if (undefinedProperties.length > 0) {
		throw new Error(
			`createType expects a type definition with the following properties: ${undefinedProperties.join(
				', ',
			)}`,
		);
	}

	typeDefinition.isType = true;

	return typeDefinition;
}

// Standard types
export const Types = {
	Number: createType({
		name: 'Number',
		default: 0,
		copy: copyValue,
		clone: cloneValue,
	}),

	Boolean: createType({
		name: 'Boolean',
		default: false,
		copy: copyValue,
		clone: cloneValue,
	}),

	String: createType({
		name: 'String',
		default: '',
		copy: copyValue,
		clone: cloneValue,
	}),

	Array: createType({
		name: 'Array',
		default: [],
		copy: copyArray,
		clone: cloneArray,
	}),

	Ref: createType({
		name: 'Ref',
		default: undefined,
		copy: copyValue,
		clone: cloneValue,
	}),

	JSON: createType({
		name: 'JSON',
		default: null,
		copy: copyJSON,
		clone: cloneJSON,
	}),
};
