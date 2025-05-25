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
