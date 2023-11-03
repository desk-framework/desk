---
title: App context
folder: topics
abstract: This article is not yet available.
---

# App context

## Initializing the global app context {#global-context}

- {@link GlobalContext +}
- {@link app +}

### Initializing activities

- {@link GlobalContext.addActivity()}
- {@link ActivationContext +}

### Initializing services

- {@link GlobalContext.addService()}
- {@link ServiceContext +}

### Initializing logging and error handling

- {@link GlobalContext.addLogHandler()}
- {@link GlobalContext.setErrorHandler()}

## Customizing app behavior and styles {#customizing}

- {@link GlobalContext.theme}
- {@link GlobalContext.i18n}

## Using global app navigation {#navigation-context}

- {@link GlobalContext.navigate()}
- {@link GlobalContext.goBack()}
- {@link GlobalContext.getPath()}

- {@link ActivationPath +}

## Rendering views {#rendering}

- {@link GlobalContext.showAlertDialogAsync()}
- {@link GlobalContext.showConfirmDialogAsync()}
- {@link GlobalContext.showModalMenuAsync()}
- {@link GlobalContext.render()}
- {@link GlobalContext.animateAsync()}

- {@link RenderContext +}

## Other functionality {#other}

- {@link GlobalContext.scheduler}
- {@link GlobalContext.log}
- {@link GlobalEmitter +}
