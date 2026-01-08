/**
 * System Profiler - measure system update performance
 */

import type { World } from '../world.js';
import type { AnySystem } from '../types.js';
import type {
	SystemProfiler,
	SystemMetrics,
	DebugEventCallback,
} from './types.js';

interface InternalMetrics extends SystemMetrics {
	timings: number[];
}

export function createSystemProfiler(
	world: World,
	historySize: number,
	onPerformanceAlert: DebugEventCallback<{
		systemName: string;
		time: number;
		threshold: number;
	}>,
): SystemProfiler {
	let enabled = false;
	const metrics = new Map<AnySystem, InternalMetrics>();
	const originalUpdates = new Map<
		AnySystem,
		(delta: number, time: number) => void
	>();
	const thresholds = new Map<string, number>();

	function getSystemName(system: AnySystem): string {
		return system.constructor.name || 'AnonymousSystem';
	}

	function getOrCreateMetrics(system: AnySystem): InternalMetrics {
		let m = metrics.get(system);
		if (!m) {
			m = {
				name: getSystemName(system),
				priority: system.priority,
				isPaused: system.isPaused,
				lastTime: 0,
				avgTime: 0,
				minTime: Infinity,
				maxTime: 0,
				updateCount: 0,
				timings: [],
			};
			metrics.set(system, m);
		}
		return m;
	}

	function recordTiming(system: AnySystem, elapsed: number): void {
		const m = getOrCreateMetrics(system);

		m.lastTime = elapsed;
		m.updateCount++;
		m.isPaused = system.isPaused;

		// Update min/max
		if (elapsed < m.minTime) {
			m.minTime = elapsed;
		}
		if (elapsed > m.maxTime) {
			m.maxTime = elapsed;
		}

		// Add to history
		m.timings.push(elapsed);
		if (m.timings.length > historySize) {
			m.timings.shift();
		}

		// Calculate average
		const sum = m.timings.reduce((a, b) => a + b, 0);
		m.avgTime = sum / m.timings.length;

		// Check threshold
		const threshold = thresholds.get(m.name);
		if (threshold !== undefined && elapsed > threshold) {
			onPerformanceAlert({
				systemName: m.name,
				time: elapsed,
				threshold,
			});
		}
	}

	function patchSystem(system: AnySystem): void {
		/* istanbul ignore if -- defensive guard, enable() already checks */
		if (originalUpdates.has(system)) {
			return;
		} // Already patched

		const original = system.update.bind(system);
		originalUpdates.set(system, original);

		system.update = (delta: number, time: number) => {
			const start = performance.now();
			original(delta, time);
			const elapsed = performance.now() - start;
			recordTiming(system, elapsed);
		};
	}

	function unpatchSystem(system: AnySystem): void {
		const original = originalUpdates.get(system);
		if (original) {
			system.update = original;
			originalUpdates.delete(system);
		}
	}

	return {
		enable(): void {
			if (enabled) {
				return;
			}
			enabled = true;

			const systems = world.getSystems();
			for (const system of systems) {
				patchSystem(system);
			}
		},

		disable(): void {
			if (!enabled) {
				return;
			}
			enabled = false;

			for (const system of originalUpdates.keys()) {
				unpatchSystem(system);
			}
		},

		isEnabled(): boolean {
			return enabled;
		},

		getMetrics(): SystemMetrics[] {
			const systems = world.getSystems();
			const result: SystemMetrics[] = [];

			for (const system of systems) {
				const m = metrics.get(system);
				if (m) {
					result.push({
						name: m.name,
						priority: m.priority,
						isPaused: system.isPaused,
						lastTime: m.lastTime,
						avgTime: m.avgTime,
						/* istanbul ignore next -- defensive: minTime set on first update */
						minTime: m.minTime === Infinity ? 0 : m.minTime,
						maxTime: m.maxTime,
						updateCount: m.updateCount,
					});
				} else {
					// System exists but no metrics yet
					result.push({
						name: getSystemName(system),
						priority: system.priority,
						isPaused: system.isPaused,
						lastTime: 0,
						avgTime: 0,
						minTime: 0,
						maxTime: 0,
						updateCount: 0,
					});
				}
			}

			// Sort by priority (execution order)
			result.sort((a, b) => a.priority - b.priority);
			return result;
		},

		getMetricsFor(system: AnySystem): SystemMetrics | undefined {
			const m = metrics.get(system);
			if (!m) {
				return undefined;
			}

			return {
				name: m.name,
				priority: m.priority,
				isPaused: system.isPaused,
				lastTime: m.lastTime,
				avgTime: m.avgTime,
				/* istanbul ignore next -- defensive: minTime set on first update */
				minTime: m.minTime === Infinity ? 0 : m.minTime,
				maxTime: m.maxTime,
				updateCount: m.updateCount,
			};
		},

		setThreshold(systemName: string, maxMs: number): void {
			thresholds.set(systemName, maxMs);
		},

		clearThreshold(systemName: string): void {
			thresholds.delete(systemName);
		},

		reset(): void {
			metrics.clear();
		},
	};
}
