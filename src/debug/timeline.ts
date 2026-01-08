/**
 * Event Timeline - record and analyze entity lifecycle events
 */

import type {
	EventTimeline,
	TimelineEvent,
	TimelineEventType,
	EventFilter,
	TimelineStats,
} from './types.js';

export function createEventTimeline(
	getFrameCount: () => number,
	maxEvents: number,
): EventTimeline & {
	_recordEvent: (
		type: TimelineEventType,
		entityIndex: number,
		componentId?: string,
		details?: Record<string, unknown>,
	) => void;
} {
	let recording = false;
	const events: TimelineEvent[] = [];
	let firstFrame = -1;
	let lastFrame = -1;

	// Stats counters
	let entitiesCreated = 0;
	let entitiesDestroyed = 0;
	let componentAdds = 0;
	let componentRemoves = 0;
	let valueChanges = 0;

	function recordEvent(
		type: TimelineEventType,
		entityIndex: number,
		componentId?: string,
		details?: Record<string, unknown>,
	): void {
		if (!recording) {
			return;
		}

		const frame = getFrameCount();
		const event: TimelineEvent = {
			type,
			frame,
			timestamp: performance.now(),
			entityIndex,
			componentId,
			details,
		};

		events.push(event);

		// Update stats
		switch (type) {
			case 'entityCreated':
				entitiesCreated++;
				break;
			case 'entityDestroyed':
				entitiesDestroyed++;
				break;
			case 'componentAdded':
				componentAdds++;
				break;
			case 'componentRemoved':
				componentRemoves++;
				break;
			case 'valueChanged':
				valueChanges++;
				break;
		}

		// Track frame range
		if (firstFrame === -1) {
			firstFrame = frame;
		}
		lastFrame = frame;

		// Enforce max events (remove oldest)
		if (events.length > maxEvents) {
			const removed = events.shift();
			// Update stats for removed event
			if (removed) {
				switch (removed.type) {
					case 'entityCreated':
						entitiesCreated--;
						break;
					case 'entityDestroyed':
						entitiesDestroyed--;
						break;
					case 'componentAdded':
						componentAdds--;
						break;
					case 'componentRemoved':
						componentRemoves--;
						break;
					case 'valueChanged':
						valueChanges--;
						break;
				}
			}
		}
	}

	return {
		startRecording(): void {
			recording = true;
		},

		stopRecording(): void {
			recording = false;
		},

		isRecording(): boolean {
			return recording;
		},

		getEvents(filter?: EventFilter): TimelineEvent[] {
			let result = events;

			if (filter) {
				if (filter.types && filter.types.length > 0) {
					const typeSet = new Set(filter.types);
					result = result.filter((e) => typeSet.has(e.type));
				}

				if (filter.entityIndex !== undefined) {
					result = result.filter((e) => e.entityIndex === filter.entityIndex);
				}

				if (filter.componentId !== undefined) {
					result = result.filter((e) => e.componentId === filter.componentId);
				}

				if (filter.frameRange) {
					const { start, end } = filter.frameRange;
					result = result.filter((e) => e.frame >= start && e.frame <= end);
				}

				if (filter.limit !== undefined && filter.limit > 0) {
					result = result.slice(-filter.limit);
				}
			}

			return result;
		},

		getStats(): TimelineStats {
			return {
				totalEvents: events.length,
				framesRecorded:
					/* istanbul ignore next -- defensive: lastFrame always >= firstFrame */
					lastFrame >= firstFrame ? lastFrame - firstFrame + 1 : 0,
				entitiesCreated,
				entitiesDestroyed,
				componentAdds,
				componentRemoves,
				valueChanges,
			};
		},

		clear(): void {
			events.length = 0;
			firstFrame = -1;
			lastFrame = -1;
			entitiesCreated = 0;
			entitiesDestroyed = 0;
			componentAdds = 0;
			componentRemoves = 0;
			valueChanges = 0;
		},

		export(): string {
			return JSON.stringify(
				{
					events,
					stats: this.getStats(),
				},
				null,
				2,
			);
		},

		// Internal method for recording events
		_recordEvent: recordEvent,
	};
}
