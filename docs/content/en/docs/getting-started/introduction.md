---
title: Introduction
abstract: Start here to learn more about the Desk framework, its use cases, and architecture.
---

# Introduction

> Welcome! Start here to learn more about the Desk framework, its use cases, and architecture.

## What is Desk? {#what-is-desk}

**The Desk framework is a comprehensive JavaScript framework, built with TypeScript, designed for developing interactive front-end applications. It provides a broad baseline for functionality such as UI components, forms, themes, logging, internationalization, overall app architecture, and testing.**

Desk is developed as an open-source project on GitHub, with an MIT license. It's free to use, and doesn't have _any_ external (runtime) dependencies.

With an API that's inspired by popular desktop and mobile GUI frameworks, it's suitable for building **interactive**, **native-like** apps that run entirely on the **client-side**. This includes web apps, but also apps that are installed on a device, such as mobile apps or desktop apps.

> **What is Desk not?**
>
> Unlike many other JavaScript frameworks, Desk is **not** a general-purpose web framework. Even though it can be used to build apps that run in a browser, it doesn't provide a one-size-fits-all solution for building websites, serving and caching pages, and rendering content.
>
> - It's not a templating engine or static site generator.
> - It doesn't render pages on the server.
> - It doesn't offer search engine optimization (SEO) features.
> - It doesn't provide a database abstraction layer.
> - It's not the right tool for building an (entire) corporate website, a blog, or an online shop.

For use on the web, Desk can still be _combined_ with other tools such as a CMS or static site generator in order to build a complete solution, with interactive client-side components that use the framework at runtime.

Great use cases for the Desk framework include:

- Immersive full-screen apps, as Single-Page Applications (SPAs) e.g. productivity apps, business apps, dashboards, e-learning, and customer portals. These applications usually require login and rely on client-side application logic for a responsive user experience (UX).
- Mobile apps, and mobile-first web applications.
- Complex forms, calculators, and other website components, e.g. support ticket or insurance claim forms, mortgage calculators, and chat widgets.
- Prototypes and MVPs: quickly test ideas with a focus on user interaction. Desk provides good UI defaults with a minimal amount of setup. Static content can be moved to the server later, if needed.

## Architecture {#architecture}

Just like other frameworks, Desk helps to break down application code into smaller pieces, and removes boilerplate code for common tasks.

The architecture of a Desk application includes the following main parts:

- **Views** represent your user interface (UI), defining the layout, content, and appearance of your app. Views may be composed of other views, and can be nested to any depth. Desk includes several basic UI components, with configurable styles that can be used out of the box.
- **Activities** represent the logic behind different screens, dialogs, or other parts of your app. Each activity may _contain_ a view, providing it with data, and handling its events.
- **Services** provide functionality that's shared between activities, including business logic, data access, and authentication.

Together, these parts take care of common tasks such as rendering the UI, handling user input, and managing application state while the user moves around your app.

A singleton **app** module is also available at all times, representing the entire application, and providing methods for navigation, rendering, logging, and more.

![Desk architecture](/docs/en/assets/desk-architecture.png)

Desk apps are **object-oriented**, and use a **hierarchical** structure. To communicate between objects you can use standard properties and methods, but the framework also provides features to **attach** objects. This enables the following special features:

- **Property bindings** automatically observe and copy property data from a parent object to a contained object (one-way only, e.g. to update views when the activity is updated).
- Objects emit **events** that can be handled by containing objects (the other way around from bindings, e.g. to handle user input).
- Objects can be **unlinked** from the hierarchy when they're no longer needed, clearing event handlers and bindings automatically, as well as unlinking further child objects.

## Example {#example}

Let's take a look at a practical example. While it's impossible to show the full power of Desk in just a few lines of code, the code below is a realistic starting point even for a more complex app.

We'll make an app that shows a counter, and two buttons to increment or decrement the current count. The app should look like this mockup:

![Mockup of a counter app with a number and up and down buttons](/docs/en/assets/introduction-mockup.png)

Refer to the end of this section for a link to the online version of this sample app.

**Creating a view** — First, let's create a view. Views are defined **statically** — meaning we create a _class_ that can be instantiated using `new` whenever we need to show the view.

Desk views can be defined using JSX syntax, as illustrated below.

{@import :sample-view-jsx}

Note that even though JSX looks like HTML, views are _not_ HTML elements. Rather, each JSX element results in a constructor — meaning `AppPage` is a regular TypeScript class.

The code below is functionally the same, using static methods rather than JSX syntax. This is useful if you're writing code in JavaScript, or if you simply don't like to use JSX.

{@import :sample-view}

In the example code, note the following:

- This view consists of UI elements (a text label and two buttons), and containers to arrange them. These components are included with the framework, and use default styles that are also included.
- The text for the `UILabel` object depends on a **binding**. Therefore, the text will be updated automatically when the value of `count` changes in the parent object (see below).
- The `UIButton` objects define _aliases_ for their Click event, which will allow us to handle both of these using a unique name (see below).
- The label element has a **style** applied to it, which we'll need to define along with the view.

There are various ways to define a custom style, and you can also change the overall look of your app using a **theme** — but in this example we'll _extend_ the default label style and assign it to a new (class) variable.

{@import :sample-style}

In this example, we could also have included these style properties inline, as below. This is useful for simple styles that aren't reused.

{@import :sample-inline-style}

**Creating the activity** — Next, we'll create an activity that contains the view above, and matches its bindings and events. To do this, we'll create a class that extends the `Activity` class, with a `ready()` method that shows our view, and some event handlers to handle button clicks.

{@import :sample-activity}

This activity performs three main tasks:

- It contains (and initializes) the current state, i.e. the `count` property.
- It creates and renders the view when ready.
- It handles events from the view, incrementing or decrementing the count. Because the view includes a binding, the view will be updated automatically.

Notice that the code in the activity does **not** need to know what the view looks like — neither does the view code need to know what the activity does with its events. This _separation of concerns_ is an important concept in Desk, which makes the overall application more maintainable and easier to extend.

While we activate a single activity immediately in this example (invoking its `ready()` method), a more complex app could include multiple (nested) activities that are activated and deactivated as the user moves around the application UI.

**Initializing the app** — Finally, we'll need to tell the app to start, initializing the renderer (for now, just the browser DOM — but other renderers may be available in the future) and adding the activity to the app.

{@import :sample-app}

At this point, we set up the following:

- Options for the web platform renderer and DOM location-based router.
- All activities and services that are used in the app.

> **Run this app:** The finished app is available online HERE.

**Compiling, bundling, and running** — The code above fits in a single file, but most real-world applications would be developed using multiple source code files, assets, dependencies, and configuration files — which need to be compiled and bundled into a distributable output package.

The Desk framework does **not** depend on a specific build tool or bundler. Refer to the {@link tutorials Tutorials} section for more information on how to set up a complete project and deploy it to the web or a native runtime environment.

## Testing {#testing}

Desk includes built-in functionality to test your application, including unit tests and integration tests.

By replacing the `useWebContext()` call to `useTestContext()` in the example above, we can run the app from the command line, without a browser. Instead of rendering the UI to a browser or other platform, or even simulating the DOM API, Desk simply keeps all view output in memory and allows us to query the result to validate that the output is correct.

The following example shows how to test our counter program, with integration tests that inspect both the activity instance and its view — simulating a button press to invoke one of the event handlers, and checking the new output.

{@import :sample-test}

## Other features {#other-features}

Desk includes many other features, such as:

- Navigation and routing
- Modal dialogs and menus
- Form input and data validation
- Logging and error handling
- Task scheduling
- Internationalization (i18n)
- Themes, icons, and colors

Many of these features can be accessed through the global {@link app-context application context} object, and can be customized to fit your specific needs.

## Next steps {#next-steps}

Refer to the following sections to continue your journey with Desk.

- {@link documentation}
- {@link tutorials}
- {@link examples}
