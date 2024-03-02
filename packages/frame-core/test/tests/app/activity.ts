import {
	app,
	Activity,
	GlobalContext,
	ManagedList,
	ManagedObject,
	AsyncTaskQueue,
} from "../../../dist/index.js";
import {
	describe,
	expect,
	test,
	useTestContext,
} from "@desk-framework/frame-test";

describe("Activity", () => {
	describe("Activation and deactivation, standalone", () => {
		function setup() {
			class MyActivity extends Activity {
				beforeActiveCalled = 0;
				beforeInactiveCalled = 0;
				protected override async beforeActiveAsync() {
					await new Promise((r) => setTimeout(r, 10));
					this.beforeActiveCalled++;
				}
				protected override async beforeInactiveAsync() {
					await new Promise((r) => setTimeout(r, 10));
					this.beforeInactiveCalled++;
				}
			}
			return { MyActivity };
		}

		test("Activate base class", async () => {
			let a = new Activity();
			expect(a.isActive()).toBeFalsy();
			await a.activateAsync();
			expect(a.isActive()).toBeTruthy();
		});

		test("Deactivate base class", async () => {
			let a = new Activity();
			await a.activateAsync();
			expect(a.isActive()).toBeTruthy();
			await a.deactivateAsync();
			expect(a.isActive()).toBeFalsy();
		});

		test("Activate base class twice, awaited", async () => {
			let a = new Activity();
			await a.activateAsync();
			expect(a.isActive()).toBeTruthy();
			await a.activateAsync();
			expect(a.isActive()).toBeTruthy();
		});

		test("Activate base class twice, not awaited", async (t) => {
			let a = new Activity();
			a.activateAsync().catch((err) => t.fail(err));
			expect(a.isActive()).toBeFalsy();
			expect(a.isActivating()).toBeTruthy();
			await a.activateAsync();
			expect(a.isActive()).toBeTruthy();
		});

		test("Deactivate base class twice, awaited", async () => {
			let a = new Activity();
			await a.activateAsync();
			await a.deactivateAsync();
			expect(a.isActive()).toBeFalsy();
			await a.deactivateAsync();
			expect(a.isActive()).toBeFalsy();
		});

		test("Deactivate base class twice, not awaited", async (t) => {
			let a = new Activity();
			await a.activateAsync();
			a.deactivateAsync().catch((err) => t.fail(err));
			expect(a.isActive()).toBeTruthy();
			expect(a.isDeactivating()).toBeTruthy();
			await a.deactivateAsync();
			expect(a.isActive()).toBeFalsy();
		});

		test("Handlers called on derived class", async () => {
			let { MyActivity } = setup();
			let a = new MyActivity();
			await a.activateAsync();
			await a.deactivateAsync();
			expect(a).toHaveProperty("beforeActiveCalled").toBe(1);
			expect(a).toHaveProperty("beforeInactiveCalled").toBe(1);
		});

		test("Activation events", async (t) => {
			let { MyActivity } = setup();
			let a = new MyActivity();
			a.listen((e) => {
				if (e.name === "Active") t.count("active");
				if (e.name === "Inactive") t.count("inactive");
			});
			await a.activateAsync();
			t.expectCount("active").toBe(1);
			t.expectCount("inactive").toBe(0);
			await a.deactivateAsync();
			t.expectCount("active").toBe(1);
			t.expectCount("inactive").toBe(1);
		});

		test("Deactivate while activating runs after", async (t) => {
			let { MyActivity } = setup();
			let a = new MyActivity();
			let p = a.activateAsync().catch((err) => t.fail(err));
			await new Promise((r) => {
				setTimeout(r, 1);
			}); // start activating
			let q = a.deactivateAsync().catch((err) => t.fail(err));
			await p;
			expect(a.isActive()).toBeTruthy();
			await q;
			expect(a.isActive()).toBeFalsy();
			expect(a).toHaveProperty("beforeActiveCalled").toBe(1);
			expect(a).toHaveProperty("beforeInactiveCalled").toBe(1);
		});

		test("Cancelling and skipping based on activation queue", async () => {
			let { MyActivity } = setup();
			let cancelled = 0;
			let a = new MyActivity();
			a.activateAsync().catch(() => cancelled++); // activates
			a.activateAsync().catch(() => cancelled++); // skips
			a.deactivateAsync().catch(() => cancelled++); // cancelled
			await a.activateAsync(); // skips
			expect(a.isActive()).toBeTruthy();
			expect(cancelled).toBe(1);
			expect(a).toHaveProperty("beforeActiveCalled").toBe(1);
			expect(a).toHaveProperty("beforeInactiveCalled").toBe(0);
		});

		test("Switch 5 times only switches once", async (t) => {
			let { MyActivity } = setup();
			let a = new MyActivity();
			a.listen((e) => {
				if (e.name === "Active") t.count("active");
				if (e.name === "Inactive") t.count("inactive");
			});
			await a.activateAsync();
			// since last transition is deactivate, first call should
			// succeed, others should skip or cancel
			a.deactivateAsync().catch((err) => t.fail(err)); // succeed async
			a.activateAsync() // cancel
				.then(() => t.fail("Not cancelled"))
				.catch(() => {});
			a.deactivateAsync().catch((err) => t.fail(err)); // skip async
			a.activateAsync() // cancel
				.then(() => t.fail("Not cancelled"))
				.catch(() => {});
			await a.deactivateAsync(); // skip async
			expect(a.isActive()).toBeFalsy();
			expect(a).toHaveProperty("beforeActiveCalled").toBe(1);
			expect(a).toHaveProperty("beforeInactiveCalled").toBe(1);
			t.expectCount("active").toBe(1);
			t.expectCount("inactive").toBe(1);
		});

		test("Unlinked activity can't be transitioned", async () => {
			let a = new Activity();
			a.unlink();
			await expect(() => a.activateAsync()).toThrowErrorAsync();
			await expect(() => a.deactivateAsync()).toThrowErrorAsync();
		});

		test("Unlinked activity can't be transitioned async", async () => {
			let a = new Activity();
			let p = expect(() => a.activateAsync()).toThrowErrorAsync();
			a.unlink();
			await p;
			let b = new Activity();
			await b.activateAsync();
			let q = expect(() => b.deactivateAsync()).toThrowErrorAsync();
			b.unlink();
			await q;
		});
	});

	describe("Active task queue", () => {
		class MyActivity extends Activity {
			q = this.createActiveTaskQueue((options) => {
				options.maxSyncTime = 10;
			});
		}

		test("Queue starts when activated", async (t) => {
			let activity = new MyActivity();
			expect(activity.q).toBeInstanceOf(AsyncTaskQueue);
			expect(activity.q.options.maxSyncTime).toBe(10);
			activity.q.add(() => t.count("task"));
			expect(activity.q.isPaused()).toBeTruthy();
			await activity.activateAsync();
			expect(activity.q.isPaused()).toBeFalsy();
			await activity.q.waitAsync();
			t.expectCount("task").toBe(1);
		});

		test("Queue pauses when inactivated", async () => {
			let activity = new MyActivity();
			await activity.activateAsync();
			await activity.q.waitAsync();
			await activity.deactivateAsync();
			expect(activity.q.isPaused()).toBeTruthy();
		});

		test("Queue stops when unlinked", async (t) => {
			let activity = new MyActivity();
			await activity.activateAsync();
			activity.q.add(() => t.count("task"));
			let p = t.tryRunAsync(() => activity.q.waitAsync());
			activity.unlink();
			let err = await p;
			expect(err)
				.asString()
				.toMatchRegExp(/stopped/);
		});
	});

	describe("Global context and parents", (scope) => {
		scope.beforeEach(() => {
			useTestContext((options) => {
				options.navigationDelay = 1;
			});
		});

		test("Add activity", () => {
			let activity = new Activity();
			app.addActivity(activity);
			expect(app.activities.getAll().includes(activity)).toBeTruthy();
		});

		test("Global context is parent", () => {
			let activity = new Activity();
			app.addActivity(activity);
			expect(ManagedObject.whence.call(GlobalContext as any, activity)).toBe(
				app,
			);
		});

		test("Nested activities", () => {
			class MyActivity extends Activity {
				nested = this.attach(new ManagedList().restrict(MyActivity));
			}
			let activity = new MyActivity();
			activity.nested.add(new MyActivity());
			app.addActivity(activity);
			expect(Activity.whence(activity)).toBeUndefined();
			expect(Activity.whence(activity.nested.first())).toBe(activity);
			expect(
				ManagedObject.whence.call(
					GlobalContext as any,
					activity.nested.first(),
				),
			).toBe(app);
		});

		test("Navigate app to activity path", async (t) => {
			let activity = new Activity();
			activity.navigationPageId = "foo";
			app.addActivity(activity);
			app.navigate(activity);
			await t.expectNavAsync(10, "foo");
			expect(activity.isActive()).toBeTruthy();
		});

		test("Navigate app to activity path with detail", async (t) => {
			let activity = new Activity();
			activity.navigationPageId = "foo";
			app.addActivity(activity);
			app.navigate(activity.getNavigationTarget("bar"));
			await t.expectNavAsync(10, "foo", "bar");
			expect(activity.isActive()).toBeTruthy();
		});
	});
});
