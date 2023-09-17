import { ManagedObject } from "../core/ManagedObject.js";
import { ManagedMap } from "../core/ManagedMap.js";
import type { ServiceContext } from "./ServiceContext.js";

/**
 * An abstract class that represents a service
 *
 * @description
 * Services are instances of the `Service` class that are made available to the rest of your application _by name_, using {@link ServiceContext}. Services can be _observed_, to watch for changes and listen for events.
 *
 * To create a service, extend this class and add it to the service context using {@link GlobalContext.addService app.addService()}. When another service is added with the same name, the existing service is replaced and unlinked.
 *
 * @see {@link ServiceContext}
 */
export abstract class Service extends ManagedObject {
	/** Returns true if this service is currently registered */
	isServiceRegistered() {
		// use duck typing to find out if parent map is a ServiceContext
		let parent = ManagedObject.whence(this);
		return (
			!this.isUnlinked() &&
			parent instanceof ManagedMap &&
			typeof (parent as ServiceContext).isServiceContext === "function"
		);
	}
}
