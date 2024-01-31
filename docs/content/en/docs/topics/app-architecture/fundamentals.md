---
title: Fundamentals
folder: topics
abstract: Understand how the Desk framework manages different parts of your app using a common foundation provided by the ManagedObject class.
---

# Fundamentals

> {@include abstract}

## Object orientation {#oo}

Most of the Desk framework API is _object oriented_. That means that you'll be using _classes_ and _objects_ to structure the application — your code describes classes, and at runtime these classes are _instantiated_ as objects.

> **Note:** All of the Desk documentation articles assume that you're familiar with object orientation in TypeScript and/or (modern) JavaScript. If you're not familiar with these concepts, now is a good time to learn more about the fundamentals of OO programming in JavaScript from one of the many resources available online.

Much of the functionality that's provided by the framework is contained in a class that should be _extended_ by your application. For example, to define an **activity**, you'll need to extend the {@link Activity} class —

```ts
class MyActivity extends Activity {
	// ... code goes here, e.g.:
	protected ready() {
		this.view = new MyView(); // MyView is another class
		app.showPage(this.view);
	}
}
```

However, not all classes are created in this way. In JavaScript (and therefore, TypeScript) you can create classes _dynamically_. This is what happens when you create a **view** using the static methods provided by different view classes:

```ts
// After this, MyView is a class too:
const MyView = UICell.with(
	{ padding: 16 }, // properties
	UILabel.withText("Hello World"), // content
);
```

One object is already created for you when the app starts: the {@link app} object — an instance of the _global_ application context. You won't need to extend any class to use its methods. Instead, you can use the _singleton_ object.

```ts
app.showAlertDialog("Hello, world");
app.addActivity(new MyActivity(), true);
```

## Managed objects {#managed-object}

Most of the classes provided by the Desk framework themselves extend the `ManagedObject` class. This class serves as the building block for the entire framework, as well as your application. It plays a crucial role in enabling **event handling** and **property binding**, by allowing objects to **attach** themselves to each other, and **unlink** themselves when they're no longer needed.

- {@link ManagedObject +}

## Attaching objects {#attach}

Managed objects are designed to be linked together into a **tree structure**, in order to enable Desk's core features. In this structure, each object may be attached to a parent object. Several objects can be attached to the same parent object, forming a hierarchy.

- Objects can be attached ad-hoc using the {@link ManagedObject.attach attach()} method, allowing you to create relationships between objects dynamically. An observer or callback function can listen for events or changes on these attached objects.
- Objects can also be attached by referencing them from specific properties. The property to be watched is set up using the {@link ManagedObject.autoAttach autoAttach()} method. Any object assigned to such a property is automatically attached to the parent object. When the referenced object is unlinked, the property is cleared (i.e. set to undefined). The {@link ManagedObject.autoAttach autoAttach()} method can also accept an observer or callback function for additional customization.
- When an object is no longer needed, it can be unlinked using the {@link ManagedObject.unlink unlink()} method. This method unlinks the object from its parent, and also unlinks all of its own attached objects.

After an object is unlinked (see below) it can no longer be attached to any other parent object. Unlinked objects also can't emit any events, be observed, or have their properties bound to other objects.

- {@link ManagedObject.attach}
- {@link ManagedObject.autoAttach}
- {@link ManagedObject.unlink}

> **Why should I need to "unlink" a managed object?**
>
> Unlinking managed objects is not always necessary. JavaScript is a garbage-collected language, so objects that are no longer referenced by any other object are automatically removed from memory.
>
> However, unlinking an object is still a good idea if the object had any event listeners or bindings added to it during its lifetime (i.e. the object references _closures_ that may themselves refer to other objects). Unlinking the object explicitly removes such references, and breaks up any circular references that may otherwise prevent the object from being garbage-collected.

## Handling unlinked objects {#handling-unlinked}

In a managed object class, you may want to perform some cleanup when the object is unlinked. The {@link ManagedObject} class allows you to override the {@link ManagedObject.beforeUnlink beforeUnlink()} method for an opportunity to perform such cleanup.

```ts
class MyObject extends ManagedObject {
	// Called just before the object is unlinked:
	protected beforeUnlink() {
		// ... cleanup code goes here
	}
}
```

On the other hand, after attaching another object, you may want to run some code when the _attached_ object is unlinked.

Both the {@link ManagedObject.attach attach()} and {@link ManagedObject.autoAttach autoAttach()} methods accept an optional callback function that's called when the attached object emits an event **and** when the object is unlinked. Alternatively, you can provide an {@link Observer} instance to handle events, unlinking, and property changes on the attached object(s).

```ts
class ParentObject extends ManagedObject {
	readonly target = this.attach(new MyObject(), (target, event) => {
		if (!target) {
			// ...handle the attached object being unlinked
		} else if (event && event.name === "Change") {
			// ...handle change event from the attached object
		}
	});
}
```

## Attaching objects through managed lists {#attach-lists}

If you need to keep track of multiple managed objects in a list, you can of course use a regular array or JavaScript `Set`. However, you may still need to check for duplicate objects (with arrays), check object types, or remove objects from the list when they're unlinked.

```ts
class Order extends ManagedObject {
	orderNumber = "";
	// ... do something useful here
}

const orderList: Order[] = [];
// ... add some orders here, then later:
for (let order of orderList) {
	if (order.isUnlinked()) continue;
	// ...
}
```

Using an array also makes it hard to listen for events on all objects at the same time.

The {@link ManagedList} class is a managed object that's designed to keep track of other managed objects, in a way that's more efficient than using a regular array.

- A {@link ManagedList} that's attached to a parent object, automatically attaches all of the contained objects as well.
- When an object is unlinked, it's automatically removed from the list.
- The {@link ManagedList} class automatically _propagates_ events from attached objects, making it easier to listen for events on all objects at the same time.

```ts
class CustomerOrders extends ManagedObject {
	readonly orders = this.attach(new ManagedList<Order>(), (target, event) => {
		// ... handle changes on this list and its objects
	});
}
```

Refer to the following article for more information about managed lists.

- {@link data-structures}

## Event handling {#event-handling}

Since managed objects are designed to work together, they typically communicate with each other using **events**. Events are emitted by an object, and can be observed using a simple handler, an observer, or using the attachment mechanisms described above.

Learn more about event handling in the next article:

- {@link event-handling}

## Property bindings {#bindings}

With managed objects arranged in a hierarchy (tree structure), you can use **bindings** to automatically synchronize the values of properties between different objects. For example, views typically keep their contents up to date using bindings, with data (properties) provided by the activity or other objects.

Learn more about property binding in the following article:

- {@link bindings}
