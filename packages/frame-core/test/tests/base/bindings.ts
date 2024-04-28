import {
	bound,
	Binding,
	ManagedList,
	ManagedObject,
} from "../../../dist/index.js";
import { describe, expect, test } from "@desk-framework/frame-test";

describe("Bindings", () => {
	test("Constructor without params", () => {
		expect(() => new Binding())
			.not.toThrowError()
			.toHaveProperty("isBinding");
		expect(String(new Binding())).toBe("bound()");
	});

	test("Constructor with empty string", () => {
		expect(() => new Binding(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
	});

	test("Global variants with empty string", () => {
		expect(() => bound(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
		expect(() => bound.number(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
		expect(() => bound.string(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
		expect(() => bound.boolean(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
		expect(() => bound.not(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
		expect(() => bound.list(""))
			.not.toThrowError()
			.toHaveProperty("isBinding");
	});

	test("Constructor with invalid argument", () => {
		expect(() => new Binding({} as any)).toThrowError();
	});

	test("Constructor with path", () => {
		let b = new Binding("x.y");
		expect(b.isBinding()).toBe(true);
		expect(b).asString().toMatchRegExp(/x\.y/);
	});

	test("Constructor with path and filters", () => {
		// DEPRECATED
		let b = new Binding("!x.y|!|!");
		expect(b.isBinding()).toBe(true);
	});

	describe("Basic bindings", () => {
		function setup() {
			class ObjectWithBind extends ManagedObject {
				bind(property: keyof this, source: Binding | string) {
					if (typeof source === "string") {
						source = bound(source);
					}
					source.bindTo(this, property);
				}
			}
			class TestObject extends ObjectWithBind {
				constructor() {
					super();

					// add dynamic property x
					let x = 0;
					Object.defineProperty(this, "x", {
						configurable: true,
						get() {
							return x;
						},
						set(v) {
							x = v;
						},
					});
				}

				/** Property using getter/setter */
				declare x: number;

				/** Regular properties */
				a? = 1;
				b? = 123;
				obj? = { foo: "bar" };

				/** Attached objects */
				readonly child = this.attach(new ChildObject());
				other = this.attach(new ChildObject());

				changeOther(child = new ChildObject()) {
					return (this.other = this.attach(child));
				}
			}
			class ChildObject extends ObjectWithBind {
				a?: number;
				aa?: number;
				bb?: number;
				nested?: ChildObject;

				attachNested() {
					return (this.nested = this.attach(new ChildObject()));
				}

				/** Object property with getter/setter to avoid being watched */
				get nonObservedObject() {
					return this._object;
				}
				set nonObservedObject(v: ChildObject | undefined) {
					this._object = v;
				}
				private _object?: ChildObject;
			}
			return { TestObject, ChildObject };
		}

		test("Single binding", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			c.child.bind("aa", "a");
			expect(c.child).toHaveProperty("aa").toBe(1);
		});

		test("Single binding, same property name", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			c.child.bind("a", "a");
			expect(c.child).toHaveProperty("a").toBe(1);
		});

		test("Single binding, update", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			// bind child.aa to a:
			c.child.bind("aa", "a");
			c.a = 2;
			expect(c.child).toHaveProperty("aa").toBe(2);
		});

		test("Single binding, update from setter", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			c.child.bind("aa", "x");
			c.x = 2;
			expect(c.child).toHaveProperty("aa").toBe(2);
		});

		test("Binding on subclass", () => {
			let { TestObject } = setup();
			class SubObject extends TestObject {
				constructor() {
					super();
					let c: number;
					Object.defineProperty(this, "c", {
						configurable: true,
						get() {
							return c;
						},
						set(v) {
							c = +v;
						},
					});
				}
				declare c: number | string;
			}
			let c = new SubObject();
			c.child.bind("aa", "a");
			expect(c.child).toHaveProperty("aa").toBe(1);
			c.c = "2";
			c.child.bind("bb", "c");
			expect(c.child).toHaveProperty("bb").toBe(2);
		});

		test("Single binding, unlink target", (t) => {
			let { TestObject } = setup();
			let c = new TestObject();
			let binding = bound.number("a");
			binding.bindTo(c.child, (a) => {
				t.log("Binding updated", a);
				t.count("update");
			});
			c.a = 1;
			c.a = 2;
			t.expectCount("update").toBe(2);
			c.child.unlink();
			c.a = 3;
			c.a = 4;
			t.expectCount("update").toBe(2);
		});

		test("Single binding, unlink origin", (t) => {
			let { TestObject } = setup();
			let c = new TestObject();
			let binding = bound.number("a");
			binding.bindTo(c.child, (a) => {
				t.log("Binding updated", a);
				t.count("update");
			});
			c.a = 1;
			c.a = 2;
			t.expectCount("update").toBe(2);
			c.unlink(); // this calls binding one more time, with NaN
			t.expectCount("update").toBe(3);
			c.a = 3;
			c.a = 4;
			t.expectCount("update").toBe(3);
		});

		test("Single binding with 2-step path", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			let nested = c.child.attachNested();
			nested.bind("aa", "child.a");
			c.child.a = 3;
			expect(c.child.nested).toHaveProperty("aa").toBe(3);
		});

		test("Single binding with 2-step path, change first", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			c.child.bind("aa", "other.aa");
			c.other.aa = 3;
			expect(c.child).toHaveProperty("aa").toBe(3);
			c.changeOther();
			expect(c.child).toHaveProperty("aa").toBe(undefined);
			c.other.aa = 4;
			expect(c.child).toHaveProperty("aa").toBe(4);
		});

		test("Single binding with 2-step path, delete first", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			c.child.bind("aa", "other.aa");
			c.other.aa = 3;
			expect(c.child).toHaveProperty("aa").toBe(3);
			(c as any).other = undefined;
			expect(c.child).toHaveProperty("aa").toBeUndefined();
		});

		test("Single binding, move target", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			let nested = c.other.attachNested();
			// make other.nested.aa binding refer to other.a:
			nested.bind("aa", "a");
			c.other.a = 3;
			expect(c.other.nested).toHaveProperty("aa").toBe(3);
			c.changeOther(nested);
			// aa binding now refers to parent.a:
			expect(c.other).toHaveProperty("aa").toBe(1);
		});

		test("Single binding with 3-step path", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			let nested = c.child.attachNested();
			let nested2 = nested.attachNested();
			nested2.bind("aa", "child.nested.aa");
			nested.aa = 3;
			expect(c.child.nested?.nested)
				.toHaveProperty("aa")
				.toBe(3);
		});

		test("Single binding with 3-step path, change first", () => {
			let { TestObject, ChildObject } = setup();
			let c = new TestObject();
			let otherNested = c.other.attachNested();
			c.child.bind("aa", "other.nested.aa");
			otherNested.aa = 3;
			expect(c.child).toHaveProperty("aa").toBe(3);
			let newOther = new ChildObject();
			let newOtherNested = newOther.attachNested();
			newOtherNested.aa = 4;
			c.changeOther(newOther);
			expect(c.child).toHaveProperty("aa").toBe(4);
		});

		test("Single binding with 3-step path, unlink first", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			let otherNested = c.other.attachNested();
			c.child.bind("aa", "other.nested.aa");
			otherNested.aa = 3;
			expect(c.child).toHaveProperty("aa").toBe(3);
			c.other.unlink();
			expect(c.child).toHaveProperty("aa").toBeUndefined();
		});

		test("Single binding with 3-step path, unlink midway", (t) => {
			let { TestObject } = setup();
			let c = new TestObject();
			let otherNested = c.other.attachNested();
			c.child.bind("aa", "other.nested.aa");
			bound("other.nested.aa").bindTo(c.child, (value, bound) => {
				t.log("3-step path updated", value, bound);
				t.count("update");
			});
			otherNested.aa = 3;
			expect(c.child).toHaveProperty("aa").toBe(3);
			t.expectCount("update").toBe(2);
			otherNested.unlink();
			expect(c.child).toHaveProperty("aa").toBeUndefined();
			let newOtherNested = c.other.attachNested();
			newOtherNested.aa = 4;
			expect(c.child).toHaveProperty("aa").toBe(4);
			t.expectCount("update").toBe(4); // undefined, 3, undefined, 4
		});

		test("Single binding with 4-step path though non-observable object ref", () => {
			let { TestObject, ChildObject } = setup();
			let c = new TestObject();
			c.other.nonObservedObject = new ChildObject();
			let nonObsNested = c.other.nonObservedObject.attachNested();
			nonObsNested.aa = 3;
			c.child.bind("aa", "other.nonObservedObject.nested.aa");
			expect(c.child).toHaveProperty("aa").toBe(3);
			nonObsNested.aa = 4;
			expect(c.child).toHaveProperty("aa").toBe(3);
			c.other.emitChange();
			expect(c.child).toHaveProperty("aa").toBe(4);
			c.other.unlink();
			expect(c.child).toHaveProperty("aa").toBeUndefined();
		});

		test("Update 2-step non-observed binding using change event", () => {
			class ChangedObject extends ManagedObject {
				get nonObserved() {
					return this._nonObserved;
				}
				set nonObserved(v) {
					this._nonObserved = v;
				}
				private _nonObserved = 1;
			}
			class BoundObject extends ManagedObject {
				a?: number;
				bindnonObserved() {
					bound("changeable.nonObserved").bindTo(this, "a");
				}
			}
			class Parent extends ManagedObject {
				constructor() {
					super();
					this.changeable = new ChangedObject();
				}
				declare changeable: ChangedObject;
				readonly bound = this.attach(new BoundObject());
			}
			let p = new Parent();
			p.bound.bindnonObserved();
			expect(p.bound).toHaveProperty("a").toBe(1);
			p.changeable.nonObserved = 2;
			expect(p.bound).toHaveProperty("a").toBe(1);
			p.changeable.emitChange("Update");
			expect(p.bound).toHaveProperty("a").toBe(2);
		});

		test("Bind to property of managed list item: indexed, first, last", (t) => {
			class ListItem extends ManagedObject {
				constructor(n: number) {
					super();
					this.n = n;
				}
				n: number;
			}
			class BoundObject extends ManagedObject {
				a?: number;
				bindNumber(b: string) {
					bound(b).bindTo(this, "a");
					return this;
				}
			}
			class Parent extends ManagedObject {
				list = new ManagedList().restrict(ListItem);
				readonly boundIndex = this.attach(
					new BoundObject().bindNumber("list.0.n"),
				);
				readonly boundFirst = this.attach(
					new BoundObject().bindNumber("list.#first.n"),
				);
				readonly boundLast = this.attach(
					new BoundObject().bindNumber("list.#last.n"),
				);
			}
			let p = new Parent();

			t.log("Testing list with zero items");
			expect(p)
				.toHaveProperty("boundIndex")
				.toHaveProperty("a")
				.toBeUndefined();
			expect(p)
				.toHaveProperty("boundFirst")
				.toHaveProperty("a")
				.toBeUndefined();
			expect(p).toHaveProperty("boundLast").toHaveProperty("a").toBeUndefined();

			t.log("Testing list with 1 item");
			p.list.add(new ListItem(1));
			expect(p).toHaveProperty("boundIndex").toHaveProperty("a").toBe(1);
			expect(p).toHaveProperty("boundFirst").toHaveProperty("a").toBe(1);
			expect(p).toHaveProperty("boundLast").toHaveProperty("a").toBe(1);

			t.log("Testing list with 2 items");
			p.list.insert(new ListItem(2), p.list.first());
			expect(p).toHaveProperty("boundIndex").toHaveProperty("a").toBe(2);
			expect(p).toHaveProperty("boundFirst").toHaveProperty("a").toBe(2);
			expect(p).toHaveProperty("boundLast").toHaveProperty("a").toBe(1);
		});

		test("Binding to plain object property", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			c.child.bind("aa", "obj.foo");
			expect(c.child).toHaveProperty("aa").toBe("bar");
			c.obj = { foo: "baz" };
			expect(c.child).toHaveProperty("aa").toBe("baz");
			c.obj = undefined;
			expect(c.child).toHaveProperty("aa").toBeUndefined();
		});

		test("Binding non-observable property: error", (t) => {
			expect(
				t.tryRun(() => {
					class Child extends ManagedObject {
						constructor() {
							super();
							bound("nonObserved").bindTo(this, "nonObserved");
						}
						nonObserved?: number;
					}
					class Parent extends ManagedObject {
						get nonObserved() {
							return 1;
						}
						child = this.attach(new Child());
					}
					new Parent();
				}),
			)
				.asString()
				.toMatchRegExp(/observable/);
		});

		test("Debug handler", (t) => {
			let { TestObject } = setup();
			try {
				Binding.debugHandler = (b) => {
					if (b.binding.toString() !== "bound(a)") t.fail("Binding mismatch");
					if (b.value !== 1) t.fail("Value mismatch");
					t.count("debug");
				};
				let c = new TestObject();
				c.child.bind("aa", bound("a").debug());
				t.expectCount("debug").toBe(1);
				Binding.debugHandler = undefined;
				c.a = 2;
				t.expectCount("debug").toBe(1);
			} finally {
				Binding.debugHandler = undefined;
			}
		});

		test("Volume test", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			let child = c.child;
			child.bind("aa", "b");
			for (let i = 0; i < 100; i++) {
				child = child.attachNested();
				child.bind("aa", "b");
				child.bind("bb", "child.a");
			}
			c.b = 2;
			c.child.a = 3;
			let check: any = c.child;
			while (check) {
				expect(check).toHaveProperty("aa").toBe(2);
				check = check.nested;
				if (check) expect(check).toHaveProperty("bb").toBe(3);
			}
		});

		test("Single binding on unlinked shouldn't fail, but also not work", () => {
			let { TestObject } = setup();
			let c = new TestObject();
			let child = c.child;
			child.unlink();
			child.bind("aa", "a");
			c.a = 123;
			expect(child.aa).toBeUndefined();
		});
	});

	describe("Managed list / array bindings", () => {
		function setup() {
			class Parent extends ManagedObject {
				child = this.attach(new Child());
				value?: any;
			}
			class Child extends ManagedObject {
				list = new ManagedList();
				bindList(b: string) {
					bound(b).bindTo(this, "list");
				}
			}
			return { Parent };
		}

		test("Can bind ManagedList to other instance", () => {
			let { Parent } = setup();
			let parent = new Parent();
			let newList = new ManagedList();
			parent.value = newList;
			parent.child.bindList("value");
			expect(parent.child).toHaveProperty("list").toBe(newList);
		});

		test("Can bind ManagedList to other instance, then remove", () => {
			let { Parent } = setup();
			let parent = new Parent();
			let newList = new ManagedList();
			parent.value = newList;
			parent.child.bindList("value");
			expect(parent.child).toHaveProperty("list").toBe(newList);
			parent.value = undefined;
			expect(parent.child).toHaveProperty("list").toBeUndefined();
		});

		test("Shouldn't bind to `count` within list", () => {
			class Child extends ManagedObject {
				constructor() {
					super();
					bound("count").bindTo(this, "count");
				}
				count?: number;
			}
			class Parent extends ManagedObject {
				count = 123;
				list = this.attach(new ManagedList(new Child()));
			}
			let p = new Parent();
			expect(p.list.first()).toHaveProperty("count").toBe(123);
		});
	});

	describe("Filtered/boolean bindings", () => {
		function setup() {
			class Parent extends ManagedObject {
				readonly child = this.attach(new Child());
				value1 = 1;
				value2 = 2;
				value3 = 3;
				str?: string;
				list?: any;
			}

			class Child extends ManagedObject {
				bindValue(b: Binding) {
					b.bindTo(this, "value");
				}
				expectValue() {
					return expect(this).toHaveProperty("value");
				}
				set value(v: any) {
					this.updates.push(v);
					this._value = v;
				}
				get value() {
					return this._value;
				}
				private _value?: any;
				updates: any[] = [];
			}

			return { parent: new Parent() };
		}

		test("Default value", () => {
			let { parent } = setup();
			const defaultValue = {};
			parent.child.bindValue(bound("noStateProperty", defaultValue));
			parent.child.expectValue().toBe(defaultValue);
		});

		test("Single negation", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("!value1"));
			parent.child.expectValue().toBe(false);
		});

		test("Double negation", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("!!value1"));
			parent.child.expectValue().toBe(true);
		});

		test("Single negation on non-existent property", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("!nonExistent"));
			parent.child.expectValue().toBe(true);
		});

		test("Double negation on non-existent property", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("!!nonExistent"));
			parent.child.expectValue().toBe(false);
		});

		test("Convert: not", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").not());
			parent.child.expectValue().toBe(false);
			parent.value1 = 0;
			parent.child.expectValue().toBe(true);
		});

		test("Convert: bound.not", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.not("value1"));
			parent.child.expectValue().toBe(false);
			parent.value1 = 0;
			parent.child.expectValue().toBe(true);
		});

		test("Convert: asBoolean", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").asBoolean());
			parent.child.expectValue().toBe(true);
			parent.value1 = 0;
			parent.child.expectValue().toBe(false);
		});

		test("Convert: bound.boolean", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.boolean("value1"));
			parent.child.expectValue().toBe(true);
			parent.value1 = 0;
			parent.child.expectValue().toBe(false);
		});

		test("Convert: asString", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").asString());
			parent.child.expectValue().toBe("1");
			parent.value1 = 0;
			parent.child.expectValue().toBe("0");
			parent.value1 = undefined as any;
			parent.child.expectValue().toBe("");
		});

		test("Convert and format: asString(format) with number", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").asString(".2f"));
			parent.child.expectValue().toBe("1.00");
			parent.value1 = 0;
			parent.child.expectValue().toBe("0.00");
			parent.value1 = undefined as any;
			parent.child.expectValue().toBe("NaN");
		});

		test("Convert and format: asString(format) with string", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("str").asString("lc"));
			parent.child.expectValue().toBe("");
			parent.str = "ABC";
			parent.child.expectValue().toBe("abc");
		});

		test("Convert: bound.string", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.string("value1"));
			parent.child.expectValue().toBe("1");
			parent.value1 = 0;
			parent.child.expectValue().toBe("0");
			parent.value1 = undefined as any;
			parent.child.expectValue().toBe("");
		});

		test("Convert: asNumber", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("str").asNumber());
			parent.child.expectValue().toBeNaN();
			parent.str = "1.5";
			parent.child.expectValue().toBe(1.5);
		});

		test("Convert: bound.number", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.number("str"));
			parent.child.expectValue().toBeNaN();
			parent.str = "1.5";
			parent.child.expectValue().toBe(1.5);
		});

		test("Convert: asList", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("list").asList());
			parent.child.expectValue().toBeUndefined();
			parent.list = ["a", "b"];
			parent.child.expectValue().toBeArray(["a", "b"]);
			parent.list = 123;
			parent.child.expectValue().toBeUndefined();
		});

		test("Convert: bound.list", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.list("list"));
			parent.child.expectValue().toBeUndefined();
			parent.list = ["a", "b"];
			parent.child.expectValue().toBeArray(["a", "b"]);
		});

		test("Matches: single parameter", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").matches(1));
			parent.child.expectValue().toBe(true);
			parent.value1 = 0;
			parent.child.expectValue().toBe(false);
		});

		test("Matches: multiple parameters", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").matches(3, 2, 1));
			parent.child.expectValue().toBe(true);
			parent.value1 = 0;
			parent.child.expectValue().toBe(false);
		});

		test("Select value", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").select(123));
			parent.child.expectValue().toBe(123);
			parent.value1 = 0;
			parent.child.expectValue().toBeUndefined();
		});

		test("Else value", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").else(123));
			parent.child.expectValue().toBe(1);
			parent.value1 = 0;
			parent.child.expectValue().toBe(123);
		});

		test("Select-else single call", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").select(123, 321));
			parent.child.expectValue().toBe(123);
			parent.value1 = 0;
			parent.child.expectValue().toBe(321);
		});

		test("Select-else combination", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").select(123).else(321));
			parent.child.expectValue().toBe(123);
			parent.value1 = 0;
			parent.child.expectValue().toBe(321);
		});

		test("And-binding", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").and(bound("value2")));
			parent.child.expectValue().toBe(2);
			parent.value2 = 0;
			parent.child.expectValue().toBe(0);
			parent.value1 = 0;
			parent.child.expectValue().toBe(0);
			parent.value2 = 2;
			parent.child.expectValue().toBe(0);

			// make sure bound value doesn't get updated until both values known
			expect(parent.child.updates).asJSONString().toBe("[2,0]");
		});

		test("Or-binding", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").or(bound("value2")));
			parent.child.expectValue().toBe(1);
			parent.value2 = 0;
			parent.child.expectValue().toBe(1);
			parent.value1 = 0;
			parent.child.expectValue().toBe(0);
			parent.value2 = 2;
			parent.child.expectValue().toBe(2);

			// make sure bound value doesn't get updated until both values known
			expect(parent.child.updates).asJSONString().toBe("[1,0,2]");
		});

		test("And-binding, 3 terms", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").and("value2").and("value3"));
			parent.child.expectValue().toBe(3);
			parent.value2 = 0;
			parent.child.expectValue().toBe(0);
			parent.value2 = 2;
			parent.child.expectValue().toBe(3);
			parent.value3 = 0;
			parent.child.expectValue().toBe(0);
		});

		test("Or-binding, 3 terms", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").or("value2").or("value3"));
			parent.value1 = 0;
			parent.value2 = 0;
			parent.value3 = 0;
			expect(parent.child.updates).asJSONString().toBe("[1,2,3,0]");
		});

		test("And-Or-binding", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("value1").and("value2").or("value3"));
			parent.value1 = 0;
			parent.value2 = 0;
			parent.value3 = 0;
			expect(parent.child.updates).asJSONString().toBe("[2,3,0]");
		});
	});

	describe("String format bindings", () => {
		function setup() {
			class Parent extends ManagedObject {
				readonly child = this.attach(new Child());
				value1 = 1;
				str = "ABC";
			}

			class Child extends ManagedObject {
				value?: any;
				bindValue(b: Binding) {
					b.bindTo(this, "value");
				}
				expectValue() {
					return expect(this).toHaveProperty("value");
				}
			}

			return { parent: new Parent() };
		}

		test("String binding without arguments", () => {
			let { parent } = setup();
			let binding = bound.strf("Abc");
			expect(String(binding)).toBe('bound.strf("Abc")');
			parent.child.bindValue(binding);
			parent.child.expectValue().asString().toBe("Abc");
		});

		test("Basic string binding", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.strf("Abc %s", "str"));
			parent.child.expectValue().asString().toBe("Abc ABC");
		});

		test("Basic string binding with Binding instance", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.strf("Abc %s", bound("str")));
			parent.child.expectValue().asString().toBe("Abc ABC");
		});

		test("Basic string binding with Binding.strf method and .asString", () => {
			let { parent } = setup();
			parent.child.bindValue(bound("str").strf("Abc %{lc}").asString());
			parent.child.expectValue().toBe("Abc abc");
		});

		test("Multiple value string binding", () => {
			let { parent } = setup();
			parent.child.bindValue(
				bound.strf("Value: %.2f %s: %i", "value1", "str", "value1").asString(),
			);
			parent.child.expectValue().toBe("Value: 1.00 ABC: 1");
		});

		test("Named string binding using %[...]", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.strf("Abc %[foo]", { foo: "str" }));
			parent.child.expectValue().asString().toBe("Abc ABC");
		});

		test("Named string binding using %[...], nonexistent property", () => {
			let { parent } = setup();
			parent.child.bindValue(bound.strf("Abc %[bar]", { foo: "str" }));
			parent.child.expectValue().asString().toBe("Abc ");
		});

		test("Multiple value named string binding using %[...]", () => {
			let { parent } = setup();
			parent.child.bindValue(
				bound.strf(
					"Value: %[value:.2f] %[str]: %[value:n] %[value:plural|a|b]",
					{
						value: "value1",
						str: "str",
					},
				),
			);
			parent.child.expectValue().asString().toBe("Value: 1.00 ABC: 1 a");
		});
	});
});
