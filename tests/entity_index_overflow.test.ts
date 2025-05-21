import { World } from '../src/World';
import { createComponent } from '../src/Component';
import { Types } from '../src/Types';

describe('Entity index overflow', () => {
	test('entity references work beyond Int16 range', () => {
		const world = new World({ entityCapacity: 33000 });
		const RefComp = createComponent({
			ref: { type: Types.Entity, default: null as any },
		});
		world.registerComponent(RefComp);

		// create a bunch of entities to exceed 32767 index
		let last: any = null;
		for (let i = 0; i < 33000; i++) {
			last = world.createEntity();
		}

		last.addComponent(RefComp, { ref: last });
		expect(last.getValue(RefComp, 'ref')).toBe(last);
	});
});
