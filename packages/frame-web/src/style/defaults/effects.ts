import { RenderContext } from "@desk-framework/frame-core";

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
	[
		"Inset",
		{
			applyEffect(element) {
				element.style.boxShadow = "inset 0 .25rem .75rem rgba(0,0,0,.1)";
			},
		},
	],
	[
		"Shadow",
		{
			applyEffect(element) {
				element.style.boxShadow = "0 .25rem .75rem rgba(0,0,0,.1)";
			},
		},
	],
	[
		"Elevate",
		{
			applyEffect(element) {
				element.style.boxShadow =
					"0 .5rem 1.5rem rgba(0,0,0,.25), 0 .5rem 1rem -.5rem rgba(0,0,0,.1)";
			},
		},
	],
];
