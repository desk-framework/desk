---
title: Introduction
abstract: Start here to learn more about the Desk framework, its use cases, and architecture.
---

# Introduction

> Welcome! Start here to learn more about the Desk framework, its use cases, and architecture.

## What is Desk? {#what-is-desk}

**The Desk framework provides a starting point for building front-end applications using TypeScript or JavaScript. It includes functionality to build complex user interfaces, handle user input, and manage application state.**

Desk is developed as an open-source project on GitHub, with an MIT license. It's free to use, and doesn't rely on any external runtime dependencies.

With an API that's inspired by popular desktop and mobile GUI frameworks, it's suitable for building **interactive**, **native-like** apps that run entirely on the **client-side**. This includes web apps, but also apps that are installed on a device, such as mobile apps or desktop apps.

> **What is Desk not?**
>
> Note that Desk is **not** a general-purpose web framework. Even though it's compiled to JavaScript and can be used to build apps that run in a browser, it isn't the right tool if you're looking to build a corporate website, a blog, or a shop.
>
> - It's not a templating engine or static site generator.
> - It doesn't render pages on the server.
> - It doesn't offer search engine optimization (SEO) features.
> - It doesn't provide a database abstraction layer.

For use on the web, Desk can still be _combined_ with other tools such as a CMS or static site generator in order to build a complete solution, with interactive client-side components that use the framework at runtime.

Great use cases for the Desk framework include:

- Immersive full-screen apps, as Single-Page Applications (SPAs) e.g. productivity apps, business apps, dashboards, e-learning, and customer portals. These applications usually require login and include lots of client-side application logic.
- Mobile apps, and mobile-first web applications.
- Complex forms, calculators, and other website components, e.g. support tickets, insurance claim forms, mortgage calculators, or chat widgets.
- Prototypes and MVPs: quickly test ideas with a focus on user interaction. Desk provides good UI defaults with a minimal amount of setup.

## Architecture {#architecture}

Like other frameworks, Desk helps to break up your application code into smaller pieces, and takes away most of the boilerplate code for common tasks.

The architecture of a Desk application is based on the following concepts:

- **Views** represent your user interface (UI), defining the layout, content, and appearance of your app. Views may be composed of other views, and can be nested to any depth. Desk includes several basic UI components, with configurable styles that can be used out of the box.
- **Activities** represent the logic behind different screens, dialogs, or other parts of your app. Each activity may _contain_ a view, providing it with data, and handling its events.
- **Services** provide functionality that's shared between activities, including business logic, data access, and authentication.

A single **app** object is also available at all times, representing the entire application. This object manages activities and services, and provides methods for navigation, rendering, logging, and more.

![Desk architecture](/docs/en/assets/desk-architecture.png)

This turns the entire application into a single **hierarchy** of objects, managed by the framework. Objects primarily interact using the following mechanisms:

- **Property bindings** automatically observe and copy data from a containing object (e.g. to update views when the activity is updated).
- Objects emit **events** that can be handled by containing objects (e.g. to handle user input).
- Objects can be **unlinked** from the hierarchy when they're no longer needed, clearing event handlers and bindings, as well as unlinking their own child objects.

## Example {#example}

Let's take a look at a practical example. While it's impossible to show the full power of Desk in just a few lines of code, the concepts shown here are used in the same way even in the most complex applications.

We'll make an app that shows a counter, and two buttons to increment or decrement the count. The app should look like this mockup:

![Mockup of a counter app](/docs/en/assets/introduction-mockup.png)

Refer to the end of this section for a link to a working version online, with the full source code.

**Creating a view** — To start, let's create a view. Views are defined **statically** — meaning we create a _class_ only once. We can then instantiate a view object using `new` whenever we need to.

Desk views can be defined using JSX syntax, as illustrated below.

{@import :sample-view-jsx}

Note that even though JSX looks like HTML, views are _not_ HTML elements. Rather, each JSX element results in a constructor — meaning `AppPage` is a regular TypeScript class.

The code below is functionally the same, using static methods rather than JSX syntax. This is useful if you're writing code in JavaScript, or if you simply prefer to avoid JSX.

{@import :sample-view}

In the example code, note the following:

- This view consists of UI elements (a text label and two buttons), and containers to arrange them. These components are included with the framework, and use default styles that are also included.
- The text for the `UILabel` object depends on a **binding**. Therefore, the text will be updated automatically when the value of `count` changes in the parent object (see below).
- The `UIButton` objects define _aliases_ for the Click event, which will allow us to handle each **event** using a unique name (see below).
- The label element has a **style** applied to it, which we'll need to define along with the view.

There are various ways to define a custom style, and you can also change the overall look of your app using a **theme** — but in this example we'll _extend_ the default label style and assign it to a new (class) variable.

{@import :sample-style}

**Creating the activity** — Next, we'll create an activity that contains the view above, and matches its bindings and events. To do this, we'll create a class that extends the `Activity` class.

{@import :sample-activity}

Note that this activity performs three main tasks:

- It contains (and initializes) the current state, i.e. the `count` property.
- It creates and renders the view when ready.
- It handles the events from the view, incrementing or decrementing the count. Because the view includes a binding, the view will be updated automatically.

The activity does **not** need to know what the view looks like — neither does the view need to know what the activity does.

In this example, we only need one activity, which is _activated_ right away. In a more complex app, we could add multiple activities, and activate them at different times — either manually or using the framework's built-in **routing** functionality. As one activity is activated, another could be deactivated, unlinking its view and removing it from the screen. Asynchronous activation and deactivation is also supported.

**Initializing the app** — Finally, we'll need to tell the app to start, initializing the platform renderer (for now, just the DOM renderer — but other renderers may be available in the future) and adding the activity to the app.

{@import :sample-app}

At this point, we can initialize the following:

- Options for the web platform renderer and DOM location-based router.
- All activities and sub-activities that are used in the app.
- All services that are used in the app.

> **Run this app:** The finished app is available online HERE.

**Compiling, bundling, and running** — While the code above fits in a single file, most real-world applications would be developed as a project that includes multiple source code files, assets, dependencies, and configuration files — which need to be compiled and bundled into a distributable output package.

The Desk framework does **not** depend on a specific build tool or bundler. Refer to the {@link tutorials Tutorials} section for more information on how to set up a complete project and deploy it to the web or a native runtime environment.

**Testing** — Desk includes functionality to test your application, including unit tests and integration tests.

By replacing the `useWebContext()` call to `useTestContext()` in the example above, we can run the app from the command line, without a browser. Instead of rendering the UI to a browser or other platform, Desk simply keeps all view output in memory and allows us to query the result to validate that the output is correct.

The following example shows how to test our counter program, with tests that inspect both the activity instance and its view — simulating a button press to invoke one of the event handlers, and checking the new output.

{@import :sample-test}

**Other features** — Desk includes many other features that are often needed in complex client-side applications, such as:

- Navigation and routing
- Modal dialogs and menus
- Form input and data validation
- Logging and error handling
- Task scheduling
- Internationalization (i18n)
- Themes, icons, and colors

More information about all of these concepts, as well as the full API reference, is available on this website.

## Next steps {#next-steps}

Refer to the following sections to continue your journey with Desk.

- {@link documentation}
- {@link tutorials}
- {@link examples}
