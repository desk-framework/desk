---
title: Event handling
folder: topics
abstract: Learn about events and different ways to handle them, as well as observing property changes directly.
---

# Event handling

> {@include abstract}

## Overview {#overview}

In a Desk front-end application, events are used to communicate between different {@link fundamentals managed objects}. Once an object **emits** an event, it can be handled either by a listener function (callback), an observer (see below), or the attached parent object or list.

Events are represented by {@link ManagedEvent} objects, which are usually created by the emitting object. The event object contains information about the event, such as the event name, the emitting object, and any additional data.

- {@link ManagedEvent +}

> **Note:** Event names are case-sensitive, and should start with a capital letter — e.g. `Click` and `ButtonClick`, not `click` or `button-click`. This makes it easy to distinguish handler methods using the event name (e.g. `onButtonClick`).

Read on to learn more about emitting and handling events.

## Emitting events {#emit}

To emit an event, use the {@link ManagedObject.emit()} method. This method can be used in two ways:

- Emitting an event using an instance of {@link ManagedEvent}.
- Emitting an event using just the event name and additional data.

- {@link ManagedObject.emit}

{@import :emit}

## Emitting change events {#change}

The {@link ManagedChangeEvent} event **subclass** is used to emit _change events_. There's nothing special about the event class itself, but change events are handled differently from other events. Notably:

- Change events from attached objects, and from services can be handled using a callback (see below).
- Change events from objects that are used with a {@link bindings binding}, trigger a forced update of the bound value.

As with other events, change events can be emitted using the {@link ManagedObject.emit()} method, but to emit a change event using just the event name, use the {@link ManagedObject.emitChange()} method instead.

Without any parameters, this method emits a change event with the name `Change` and no additional data.

- {@link ManagedChangeEvent +}
- {@link ManagedObject.emitChange}

{@import :emitChange}

## Handling change events from attached objects {#change-attach}

With an architecture that's based on _composition_, parent objects are often interested in changes to attached objects — for example, to keep their own internal state up to date. Therefore, the {@link ManagedObject} class provides an easy way to handle change events from attached objects

You can simply provide a callback (or an {@link Observer} instance, see below) to the {@link ManagedObject.attach()} or {@link ManagedObject.autoAttach()} methods to listen for change events. When a change event is emitted by an attached object, the parent object calls the callback automatically.

{@import :attach-callback}

## Handling change events from services {#service-events}

Shared functionality and data is commonly encapsulated in a {@link Service}. Services are attached to the {@link GlobalContext.services app.services} object, and can be accessed through its {@link ServiceContext.get get()} method using the service ID (e.g. `Auth` or `Settings`).

- {@link Service}

Refer to the documentation for {@link services} to learn more.

One of the most powerful features of services is that they can be _observed_ by activities and other services. A callback function (or an {@link Observer} instance, see below) can be used to listen for change events that are emitted by a service with a particular ID, along with service registration, replacement, and unlinking.

- {@link Activity.observeService}

{@import :service-callback}

## Handling events using listeners {#listen}

Listeners provide the simplest mechanism for handling events. A listener adds a callback function that's invoked whenever any event is emitted by the target object. The listener stops automatically when the target object is unlinked, but is otherwise never removed.

- {@link ManagedObject.listen}

{@import :listen}

> **Note:** Since listeners can't be removed, don't add a listener to an object that's intended to 'outlive' the listener. For example, from the {@link Activity.ready()} method, don't add a listener to an object that stays around during the entire lifetime of the application. In that case, use a (service) observer, or find a way to attach the target object to the activity.

## Handling events using observers {#observers-events}

Observers provide the most powerful mechanism for handling events. An observer is an instance of a specific {@link Observer} subclass, which observes a single object at a time. By overriding methods of the base class, or adding your own, you can handle all events as well as property changes. The observer stops automatically when the target object is unlinked, but can also be stopped manually.

- {@link Observer +}

After creating an observer, you can start observing an object using the {@link Observer.observe()} method. Once the observer is started, its {@link Observer.handleEvent()} method is called for every event emitted by the target object.

- {@link Observer.observe}
- {@link Observer.handleEvent}

You can override this method to handle events, or stick with the base implementation which tries to find a specific method for each event using its name (e.g. `onConnected()` for a `Connected` event).

{@import :observer-events}

Alternatively, you can pass an observer instance to the {@link ManagedObject.attach()} or {@link ManagedObject.autoAttach()} methods to observe attached objects. In the case of autoAttach, the observer is started and stopped automatically when a new object is attached or detached.

{@import :observer-attach}

In addition, observers can be used to handle unlinking, and attachment changes (i.e. moving the observed object to a different attached parent). Use the following methods to handle these events:

- {@link Observer.handleUnlink}
- {@link Observer.handleAttachedChange}

## Handling property changes using observers {#observers-properties}

With the help of an {@link Observer} instance, you can also handle _property changes_ of a managed object. Each property is observed individually (which adds a property _getter_ and _setter_ under the hood) allowing the observer to intercept changes. In the observer, you can either handle all property changes in a single method, or handle each property change individually — either synchronously or asynchronously.

> **Observed properties and maintainability**
>
> Although being able to observe any property directly seems like a powerful and convenient feature, it's best not to rely on this mechanism too much. From the part of your code _where a property is set_, it's not immediately obvious that a handler will be called, possibly causing unexpected side effects, or 'magic'.
>
> Where possible, consider using change events (see above) to communicate state changes, or use get/set methods rather than exposing public properties. Only use observers where side effects _are expected_ — for example, the framework itself uses observers to handle property changes of UI components, to be able to re-render view elements when needed; which can be considered an expected side effect.

To start observing a property, add a call to {@link Observer.observeProperty observeProperty()} or {@link Observer.observePropertyAsync observePropertyAsync()} to your implementation of the {@link Observer.observe observe()} method.

- {@link Observer.observeProperty}
- {@link Observer.observePropertyAsync}

Since the {@link Observer.observe observe} method itself returns the Observer instance, you can chain these calls together as shown below.

Once a property is observed, the observer's {@link Observer.handlePropertyChange handlePropertyChange()} method is called whenever the property is set, _or_ when a managed object referenced by the property emits a change event. By default, this method calls a specific handler method for each property change, using the property name (e.g. `onNameChange()` for a `name` property). You can override the {@link Observer.handlePropertyChange handlePropertyChange} method to handle property changes in a different way, or implement a handler method for each property change.

{@import :observer-properties}

## Handling view events {#view-events}

In practice, the most common source of events in a front-end application is the _view_ — i.e. a hierarchy of UI components, containers, and other view objects, all of which emit events when the user interacts with them.

When a view is attached to an activity or view composite, these events are handled by a single method. By default, this method tries to find a specific handler method for each event using the event name (e.g. `onButtonClick()` for a `ButtonClick` event). You can override this method to handle events in a different way, or implement a handler method for each event.

- {@link Activity.delegateViewEvent}

For events that are emitted by a view object, you can use the {@link ViewEvent} type to describe the first (and only) handler parameter. This type is based on the {@link ManagedEvent} class, but narrows down the type of the `source` property to a specific {@link View} object. From the event handler, you can access the view object using this property.

- {@link ViewEvent +}

> **Note:** In an event handler, you can also access the rendered output element (e.g. DOM element) of a UI component using the {@link UIComponent.lastRenderOutput} property, if needed.

Since views are typically defined using static `with` methods, which allow you to _alias_ events, adding event handlers to an activity or view composite class is as simple as adding a handler method with the appropriate name. In the case of view composites, if the handler does not return true or if a handler doesn't exist, the event is _delegated_ to the parent object (see next section).

{@import :view-events}

## Handling delegated view events {#delegate-view-events}

There are a few situations where being able to find the emitting view object using the event `source` property may not be enough — notably when the view is contained by another view object (or composite) that's important to understanding the source of the event.

- For events that are emitted by a view object **within a list** (i.e. a {@link UIList} instance), handling the event often requires access to the list item object (or value) that's associated with the view object.
- For events that are emitted from **within a form**, access to the form context object (i.e. {@link UIFormContext} instance) is often useful.
- For events that are emitted from **within a view composite**, and not handled by the composite itself, access to the composite object is often useful.

In these cases, the event is _delegated_ by the containing view object or composite by emitting a **new** event object, that references both the containing view and the original event object. The new object has its {@link ManagedEvent.delegate} property set to the containing view object, and the {@link ManagedEvent.inner} property set to the original event object.

You can use the {@link DelegatedEvent} generic type to describe such events, or more specifically the {@link UIList.ItemEvent} type for events that are emitted from within a list.

- {@link DelegatedEvent +}
- {@link UIList.ItemEvent}

The following example shows how to handle an event that's emitted from within a list.

{@import :view-delegate}
