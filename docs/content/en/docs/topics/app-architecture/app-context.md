---
title: App context
folder: topics
abstract: An overview of the functionality provided by the global application context.
---

# App context

> {@include abstract}

## Overview {#overview}

The Desk app context refers to the _singleton_ {@link app} object, which is an instance of the {@link GlobalContext} class. The app context has two main roles:

- It serves as the _root_ of the application hierarchy, and references several other context objects that affect the application as a whole.
- It provides commonly used functionality that controls the overall application — such as navigation, page and modal rendering, and logging.

The {@link app} object is created immediately when the app starts, and is made available as a top-level import from the main Desk package.

- {@link app +}
- {@link GlobalContext +}

## Initializing the global app context {#global-context}

The functionality provided by the application context depends on the runtime platform in which your app is used, and needs to be _initialized_ before use.

- To initialize the app context in a browser (i.e. using the DOM API) you'll need to use the {@link useWebContext} function.
- To initialize a test with full app functionality (activities, rendering, etc.) you'll need to use the {@link useTestContext} function.
- Currently, no other platforms are supported — but with more platforms, each package would have to export an initialization function to set up its own context objects.

After initialization, you can add activities and (optionally) services to the application hierarchy, and customize several other app elements; refer to each of the sections below.

### Initializing activities

To use activities effectively, the need to be added to the application hierarchy — either by adding them directly using the method below, or by attaching an {@link Activity} object to an existing parent activity.

- {@link GlobalContext.addActivity()}

As shown in other examples throughout this documentation, a real-world Desk application contains one or more activities, which are typically added directly to the app context using the {@link GlobalContext.addActivity addActivity()} method.

This method adds the provided activity to the _activity context_, available as {@link GlobalContext.activities app.activities}. This object contains a list of activities, as well as a reference to the _navigation path_ that handles platform-dependent logic for external navigation (see below). The activity context ensures that activities are activated and deactivated according to the current navigation path.

- {@link ActivityContext +}

For more information, refer to the documentation for {@link activities}.

### Initializing services

The app context also includes a method to register a service, so that it can be retrieved (or observed) by name — making it available to the rest of the application.

- {@link GlobalContext.addService()}

This method adds the provided service to the _service context_, available as {@link GlobalContext.services app.services}. This object manages the list of currently registered services.

- {@link ServiceContext +}

For more information, refer to the documentation for {@link services}.

## Rendering views {#rendering}

While the app is running, the app context can be used to render the application's UI. Most commonly, an activity will render a full-screen view when ready (i.e. from the {@link Activity.ready()} method), using the method below.

- {@link GlobalContext.showPage()}

The app context also includes methods to render predefined modal views, which can be used at any time — usually from event handlers within the current activity. The alert and confirmation dialogs, as well as modal menus that are displayed, may be rendered using platform-specific UI elements or using a custom view. The {@link GlobalContext.theme app.theme} object includes options for customizing the appearance of these views.

> **Note:** While these methods can be used from anywhere in the application, they're typically only used from within an activity. Using these rendering methods from within services or models, for example to show error messages or perform data validation, is considered an anti-pattern and should be avoided.

- {@link GlobalContext.showAlertDialogAsync()}
- {@link GlobalContext.showConfirmDialogAsync()}
- {@link GlobalContext.showModalMenuAsync()}
- {@link GlobalContext.render()}

UI elements can be animated using the following method. There are also several other ways to introduce animation into your application — for more information, refer to the documentation for {@link animation animations}.

- {@link GlobalContext.animateAsync()}

All of these methods leave the heavy lifting to the platform-specific rendering context, which is referenced as {@link GlobalContext.renderer app.renderer}. This object is initialized automatically, as an instance of the following class.

- {@link RenderContext +}

## Customizing app behavior and styles {#customizing}

The app context refers to two other objects that are used to customize the application as a whole.

The {@link GlobalContext.theme theme} object is used to customize the appearance of the application. For more information, refer to the documentation for {@link themes-colors Themes and colors} and {@link icons icons}.

- {@link GlobalContext.theme}

Another important aspect of UI presentation beyond its appearance is text handling for internationalization (i18n). The {@link GlobalContext.i18n i18n} property refers to the current {@link I18nProvider} instance, which is used to translate and format strings automatically. For more information, refer to the documentation for {@link internationalization}.

- {@link GlobalContext.i18n}

## Using global app navigation {#navigation-context}

Desk applications use a global navigation context, like a single-page web application that runs in a browser — even if the app is _not_ running in a browser (e.g. while testing or in a native environment).

The app context includes several methods that can be called to navigate between paths, and to control the navigation history.

- {@link GlobalContext.navigate()}
- {@link GlobalContext.goBack()}
- {@link GlobalContext.getPath()}

For more information specific to the web platform, refer to the documentation for {@link web-navigation web navigation}.

The app context uses an object that's initialized automatically, which handles both navigation and activation based on the current path. This object is available as {@link ActivityContext.navigationPath app.activities.navigationPath}. Because it's used automatically by the navigation methods above as well as the {@link ActivityContext} class, this object rarely needs to be used on its own.

- {@link NavigationPath +}

## Registering log and error handlers {#log-error-handlers}

The app context includes functionality for sending log messages and errors to registered handlers. This functionality is provided by the {@link GlobalContext.log app.log} methods. By default, messages are sent to the console, but you can register a custom handler to send messages to a different destination such as a file or a remote server.

Use the following methods to register a custom log handler and/or error handler.

- {@link GlobalContext.addLogHandler()}
- {@link GlobalContext.setErrorHandler()}

For more information, refer to the documentation for {@link errors-logging errors and logging}.

## Other functionality {#other}

In addition to the methods and properties described above, the app context provides several other commonly used 'global' objects and methods. Refer to the documentation for each of these objects for more information.

- {@link GlobalContext.scheduler}
- {@link GlobalContext.log}
- {@link GlobalEmitter +}
