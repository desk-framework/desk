import {
	ManagedList,
	ManagedMap,
	ManagedObject,
	ManagedRecord,
} from "../../../dist/index.js";
import { describe, expect, test } from "@desk-framework/test";

describe("ManagedRecord", () => {
	test("Create using given properties", () => {
		let r = ManagedRecord.create({ foo: 123 });
		expect(r).toBeInstanceOf(ManagedRecord);
		expect(r).toHaveProperty("foo").toBe(123);
	});

	test("Create subclass using given properties", () => {
		class MyRecord extends ManagedRecord {
			foo = 1;
		}
		let r = MyRecord.create({ foo: 123 });
		expect(r).toBeInstanceOf(ManagedRecord);
		expect(r).toHaveProperty("foo").toBe(123);
	});

	test("Find sibling records", () => {
		let list = new ManagedList().autoAttach(true);
		let a = ManagedRecord.create({ name: "a" });
		let b = ManagedRecord.create({ name: "b" });
		list.add(a, b);
		expect(a.getNextSibling()).toBe(b);
		expect(b.getPreviousSibling()).toBe(a);
		expect(a.getPreviousSibling()).toBeUndefined();
		expect(b.getNextSibling()).toBeUndefined();
	});

	test("Find sibling records: not in attached list", () => {
		let list = new ManagedList();
		let a = ManagedRecord.create({ name: "a" });
		let b = ManagedRecord.create({ name: "b" });
		list.add(a, b);
		expect(a.getNextSibling()).toBeUndefined();
		expect(b.getPreviousSibling()).toBeUndefined();
		list.autoAttach(true);
		expect(a.getNextSibling()).toBe(b);
	});

	test("Find parent record: direct reference, list, map", () => {
		class MyRecord extends ManagedRecord {
			record = this.attach(ManagedRecord.create({ foo: 123 }));
			list = this.attach(new ManagedList().restrict(ManagedRecord));
			map = this.attach(new ManagedMap().restrict(ManagedRecord));
		}
		let r = new MyRecord();
		r.list.add(ManagedRecord.create({ bar: 123 }));
		r.map.set("a", ManagedRecord.create({ a: "a" }));
		expect(r.record.getParentRecord()).toBe(r);
		expect(r.list.first()!.getParentRecord()).toBe(r);
		expect(r.map.get("a")!.getParentRecord()).toBe(r);
	});

	test("Find parent record: indirect reference", () => {
		class MyObject extends ManagedObject {
			record = this.attach(ManagedRecord.create({ foo: 123 }));
		}
		class MyRecord extends ManagedRecord {
			object = this.attach(new MyObject());
		}
		let r = new MyRecord();
		expect(r.object.record.getParentRecord()).toBe(r);
	});
});