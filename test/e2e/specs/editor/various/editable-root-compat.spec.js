/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Editable root block event handler compatibility', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'delivers keyboard events to a block wrapperProps handler', async ( {
		editor,
		page,
	} ) => {
		// A third party adds an event handler to every block through
		// wrapperProps, the surface host mode would otherwise bypass.
		await page.evaluate( () => {
			window.__extKeys = [];
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onKeyDown: ( event ) =>
								window.__extKeys.push( event.key ),
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );

		// Move to the first paragraph so the wrapper becomes the editing host.
		await page.keyboard.press( 'ArrowUp' );

		await page.evaluate( () => ( window.__extKeys = [] ) );
		await page.keyboard.type( 'x' );

		await expect
			.poll( () => page.evaluate( () => window.__extKeys ) )
			.toContain( 'x' );
	} );

	test( 'lets a block wrapperProps handler cancel the default action', async ( {
		editor,
		page,
	} ) => {
		await page.evaluate( () => {
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events-prevent',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onKeyDown: ( event ) => {
								if ( event.key === 'b' ) {
									event.preventDefault();
								}
							},
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );

		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'End' );

		// 'a' types; 'b' is canceled by the handler.
		await page.keyboard.type( 'ab' );

		const [ firstParagraph ] = await editor.getBlocks();
		expect( firstParagraph.attributes.content ).toBe( 'aa' );
	} );
} );
