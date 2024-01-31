---
title: Activities
folder: topics
abstract: This article is not yet available.
---

# Activities

## About activities

## Creating an activity {#creating-an-activity}

### Writing an activity class

- {@link Activity +}

### Adding an activity to the application context

- {@link GlobalContext.addActivity}

### Activating and deactivating an activity

- {@link Activity.activateAsync}
- {@link Activity.deactivateAsync}

- {@link Activity.isActive}
- {@link Activity.isActivating}
- {@link Activity.isDeactivating}
- {@link ManagedObject.isUnlinked}

**Handling lifecycle states**

- {@link Activity.beforeActiveAsync}
- {@link Activity.afterActiveAsync}
- {@link Activity.beforeInactiveAsync}
- {@link Activity.afterInactiveAsync}
- {@link ManagedObject.beforeUnlink}

**Showing views for an activity**

## Nesting activities {#nesting}

## Using paths for automatic routing {#routing}

- {@link Activity.path}

## Handling complex path matches {#complex-path-matches}

**Path captures**

- {@link Activity.pathMatch}

**Path match handlers**

- {@link Activity.handlePathMatchAsync}

## Handling navigation events {#navigation-events}

- {@link Activity.onNavigate}
- {@link Activity.handleNavigateAsync}
- {@link Activity.getNavigationTarget}
- {@link NavigationTarget +}

## Setting the window title {#window-title}

- {@link Activity.title}

## Scheduling background tasks {#background-tasks}

- {@link Activity.createActiveTaskQueue}