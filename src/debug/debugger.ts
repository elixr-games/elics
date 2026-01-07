/**
 * Main Debugger - attaches to a World instance and provides debugging capabilities
 */

import type { World } from '../world.js';
import type {
	Debugger,
	DebuggerOptions,
	DebugEventType,
	DebugEventData,
	DebugEventCallback,
	Unsubscribe,
} from './types.js';

import { createEntityInspector } from './inspector.js';
import { createSystemProfiler } from './profiler.js';
import { createQueryDebugger } from './queries.js';
import { createSnapshotManager } from './snapshots.js';
import { createEventTimeline } from './timeline.js';

const DEFAULT_OPTIONS: Required<DebuggerOptions> = {
	enableProfiling: false,
	enableTimeline: false,
	maxSnapshots: 50,
	maxTimelineEvents: 10000,
	profilingHistorySize: 1000,
};

export function attachDebugger(
	world: World,
	options?: DebuggerOptions,
): Debugger {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// State
	let paused = false;
	let pendingSteps = 0;
	let frameCount = 0;

	// Event emitter
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const listeners = new Map<DebugEventType, Set<DebugEventCallback<any>>>();

	function emit<E extends DebugEventType>(
		event: E,
		data: DebugEventData[E],
	): void {
		const callbacks = listeners.get(event);
		if (callbacks) {
			for (const callback of callbacks) {
				try {
					callback(data);
				} catch (e) {
					console.error(`[elics-debug] Error in ${event} listener:`, e);
				}
			}
		}
	}

	function on<E extends DebugEventType>(
		event: E,
		callback: DebugEventCallback<DebugEventData[E]>,
	): Unsubscribe {
		let callbacks = listeners.get(event);
		if (!callbacks) {
			callbacks = new Set();
			listeners.set(event, callbacks);
		}
		callbacks.add(callback);

		return () => {
			callbacks!.delete(callback);
		};
	}

	// Store original methods
	const originalUpdate = world.update.bind(world);

	// Create sub-modules
	const inspector = createEntityInspector(world);

	const profiler = createSystemProfiler(
		world,
		opts.profilingHistorySize,
		(data) => {
			emit('performanceAlert', data);
		},
	);

	const queries = createQueryDebugger(world, () => frameCount);

	const snapshotManager = createSnapshotManager(
		world,
		() => frameCount,
		opts.maxSnapshots,
	) as ReturnType<typeof createSnapshotManager> & {
		_checkAutoCapture: () => void;
	};

	const timeline = createEventTimeline(
		() => frameCount,
		opts.maxTimelineEvents,
	);

	// Patch world.update
	world.update = function (delta: number, time: number): void {
		// Skip if paused (unless stepping)
		if (paused && pendingSteps <= 0) {
			return;
		}

		if (pendingSteps > 0) {
			pendingSteps--;
		}

		// Call original update
		originalUpdate(delta, time);
		frameCount++;

		// Check auto-capture
		snapshotManager._checkAutoCapture();

		// Emit frame complete event
		emit('frameComplete', { frame: frameCount, delta, time });
	};

	// Enable features based on options
	if (opts.enableProfiling) {
		profiler.enable();
	}

	if (opts.enableTimeline) {
		timeline.startRecording();
	}

	// Build debugger object
	const debugger_: Debugger = {
		get isPaused(): boolean {
			return paused;
		},

		get frameCount(): number {
			return frameCount;
		},

		pause(): void {
			if (!paused) {
				paused = true;
				emit('pause', { frame: frameCount });
			}
		},

		resume(): void {
			if (paused) {
				paused = false;
				pendingSteps = 0;
				emit('resume', { frame: frameCount });
			}
		},

		step(frames: number = 1): void {
			pendingSteps = frames;
			emit('step', { frames, frame: frameCount });
		},

		inspect: inspector,
		profiler,
		queries,
		snapshots: snapshotManager,
		timeline,

		on,

		detach(): void {
			// Restore original update
			world.update = originalUpdate;

			// Disable profiler (restores system.update methods)
			profiler.disable();

			// Stop timeline recording
			timeline.stopRecording();

			// Clear listeners
			listeners.clear();
		},
	};

	return debugger_;
}
