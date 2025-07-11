let CHECKS_ON: boolean = true;

export function toggleChecks(value: boolean): void {
	CHECKS_ON = value;
}

export enum ErrorMessages {
	ComponentNotRegistered = 'Component type not registered',
	ModifyDestroyedEntity = 'Cannot modify destroyed entity',
	QueryNotRegistered = 'Query not registered',
	TypeNotSupported = 'Type not supported',
	SystemAlreadyRegistered = 'System already registered',
	ComponentAlreadyRegistered = 'Component already registered',
	InvalidDefaultValue = 'Invalid default value',
	InvalidEnumValue = 'Invalid enum value',
}

export function assertCondition(
	condition: boolean,
	message: ErrorMessages,
	object: any,
): void {
	if (CHECKS_ON && !condition) {
		throw new Error(`${message}: ${object}`);
	}
}

export function assertValidEnumValue(
	value: number,
	enumObject: { [key: string]: any },
	fieldName: string,
): void {
	if (!CHECKS_ON) {
		return;
	}

	const enumValues = Object.values(enumObject).filter(
		(v) => typeof v === 'number',
	) as number[];

	if (!enumValues.includes(value)) {
		throw new Error(
			`${ErrorMessages.InvalidEnumValue}: ${value} is not a valid value for enum ${fieldName}`,
		);
	}
}
