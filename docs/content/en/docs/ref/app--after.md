---
id: app:after
---

### Initializing the app

Use the following methods to initialize the application.

- {@link GlobalContext.addActivity()}
- {@link GlobalContext.addService()}

### Logging

Use the `app.log` methods to write messages and data to the application log.

- {@link GlobalContext.log}

### Navigation

Use the following methods to navigate the user through the application.

- {@link GlobalContext.navigate()}
- {@link GlobalContext.goBack()}
- {@link GlobalContext.getPath()}

### Rendering

Use the following methods to render views.

- {@link GlobalContext.showAlertDialogAsync()}
- {@link GlobalContext.showConfirmDialogAsync()}
- {@link GlobalContext.showModalMenuAsync()}
- {@link GlobalContext.render()}
- {@link GlobalContext.animateAsync()}

### Customization

Use the following properties and methods to add custom behavior and styles to the application.

- {@link GlobalContext.theme}
- {@link GlobalContext.i18n}
- {@link GlobalContext.addLogHandler()}
- {@link GlobalContext.setErrorHandler()}
