let CHECKS_ON: boolean = true;

export function toggleChecks(value: boolean): void {
	CHECKS_ON = value;
}

export enum ErrorMessages {
	TypeNotSupported = 'Type not supported',
	InvalidDefaultValue = 'Invalid default value',
	InvalidEnumValue = 'Invalid enum value',
	InvalidRangeValue = 'Value out of range',
}

export function assertCondition(
	condition: boolean,
	message: ErrorMessages,
	object: unknown,
): void {
	if (CHECKS_ON && !condition) {
		throw new Error(`${message}: ${object}`);
	}
}

export function assertValidEnumValue(
	value: string,
	enumObject: { [key: string]: string },
	fieldName: string,
): void {
	if (!CHECKS_ON) {
		return;
	}

	const enumValues = Object.values(enumObject);

	if (!enumValues.includes(value)) {
		throw new Error(
			`${ErrorMessages.InvalidEnumValue}: ${value} is not a valid value for enum ${fieldName}`,
		);
	}
}

export function assertValidRangeValue(
	value: number,
	min: number | undefined,
	max: number | undefined,
	fieldName: string,
): void {
	if (!CHECKS_ON) {
		return;
	}

	if (min !== undefined && value < min) {
		throw new Error(
			`${ErrorMessages.InvalidRangeValue}: ${value} is below minimum ${min} for field ${fieldName}`,
		);
	}

	if (max !== undefined && value > max) {
		throw new Error(
			`${ErrorMessages.InvalidRangeValue}: ${value} is above maximum ${max} for field ${fieldName}`,
		);
	}
}
