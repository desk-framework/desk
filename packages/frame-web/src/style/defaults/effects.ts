import { RenderContext, app } from "@desk-framework/frame-core";
import { CLASS_MODAL_WRAPPER } from "./css";

// Note: it's tempting to come up with some dazzling effects here,
// but this would impact bundle size for no good reason. Likely, an
// app will have its own set of effects, possibly using CSS classes, etc.,
// and other effects can be shipped as NPM modules. After some time
// more mainstream effect can be added here.

/** @internal Default set of visual effects */
export const effects: [
	name: string,
	effect: RenderContext.OutputEffect<HTMLElement>,
][] = [
	["Inset", makeBoxShadowEffect("inset 0 .25rem .75rem rgba(0,0,0,.1)")],
	["Shadow", makeBoxShadowEffect("0 .25rem .75rem rgba(0,0,0,.1)")],
	[
		"Elevate",
		makeBoxShadowEffect(
			"0 .5rem 1.5rem rgba(0,0,0,.25), 0 .5rem 1rem -.5rem rgba(0,0,0,.1)",
		),
	],
	[
		"DragModal",
		{
			applyEffect: applyDraggable,
		},
	],
];

function makeBoxShadowEffect(
	boxShadow: string,
): RenderContext.OutputEffect<HTMLElement> {
	return {
		applyEffect: function (element: HTMLElement) {
			element.style.boxShadow = boxShadow;
		},
	};
}

// Debounce drag start by keeping track of the last start time
let _dragStart = 0;

// keep track of elements that were already dragged
let _draggedElements = new WeakMap<HTMLElement, { x: number; y: number }>();

function applyDraggable(element: HTMLElement) {
	if (element.dataset.appliedDragModalEffect) return;
	element.dataset.appliedDragModalEffect = "true";
	element.addEventListener("mousedown", handlePress);
	element.addEventListener("touchstart", handlePress, { passive: false });

	let dragElt: HTMLElement | undefined;
	function handlePress(domEvent: MouseEvent | TouchEvent) {
		if (_dragStart > Date.now() - 40 || (domEvent as MouseEvent).button) return;
		let startX =
			((domEvent as TouchEvent).touches &&
				(domEvent as TouchEvent).touches[0]!.clientX) ||
			(domEvent as MouseEvent).clientX;
		let startY =
			((domEvent as TouchEvent).touches &&
				(domEvent as TouchEvent).touches[0]!.clientY) ||
			(domEvent as MouseEvent).clientY;
		if (startX === undefined || startY === undefined) return;

		// find modal wrapper element
		if (!dragElt) {
			let modalWrapper = element.parentElement;
			while (modalWrapper && modalWrapper.className !== CLASS_MODAL_WRAPPER) {
				modalWrapper = modalWrapper.parentElement;
			}
			if (!modalWrapper || !modalWrapper.firstChild) return;
			dragElt = modalWrapper.firstChild as HTMLElement;
		}
		let initial = _draggedElements.get(dragElt) || { x: 0, y: 0 };
		let dragged = { ...initial };

		// found the element and coordinates, start dragging now
		_dragStart = Date.now();
		let moved = false;

		/** Handler that's invoked when the mouse/touch input is moved */
		const moveHandler = (e: MouseEvent | TouchEvent) => {
			let x =
				((e as TouchEvent).touches && (e as TouchEvent).touches[0]!.clientX) ||
				(e as MouseEvent).clientX;
			let y =
				((e as TouchEvent).touches && (e as TouchEvent).touches[0]!.clientY) ||
				(e as MouseEvent).clientY;
			x = Math.max(0, Math.min(x, window.innerWidth));
			y = Math.max(0, Math.min(y, window.innerHeight));
			let diffX = x - startX;
			let diffY = y - startY;
			if (!moved && Math.abs(diffX) < 2 && Math.abs(diffY) < 2) return;

			// set transition and transform CSS properties to move the element
			dragElt!.style.transition = "none";
			let tX = (dragged.x = initial.x + diffX);
			let tY = (dragged.y = initial.y + diffY);
			dragElt!.style.transform = `translate(${tX}px, ${tY}px)`;
			moved = true;
			e.preventDefault();
			e.stopPropagation();
		};

		/** Handler that's invoked when the mouse button/touch input is released */
		const upHandler = (e: MouseEvent) => {
			if (moved) {
				e.preventDefault();
				e.stopPropagation();
				_draggedElements.set(dragElt!, dragged);
			}
			_dragStart = 0;
			app.renderer!.schedule(() => {
				window.removeEventListener("touchmove", moveHandler, {
					passive: false,
					capture: true,
				} as any);
				window.removeEventListener("mousemove", moveHandler, true);
				window.removeEventListener("touchend", upHandler as any, true);
				window.removeEventListener("mouseup", upHandler, true);
				window.removeEventListener("click", upHandler, true);
			});
		};

		// add all handlers
		window.addEventListener("touchmove", moveHandler, {
			passive: false,
			capture: true,
		});
		window.addEventListener("mousemove", moveHandler, true);
		window.addEventListener("touchend", upHandler as any, true);
		window.addEventListener("mouseup", upHandler, true);
		window.addEventListener("click", upHandler, true);
	}
}
