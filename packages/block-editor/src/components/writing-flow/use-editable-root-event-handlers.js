/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getSelectionEditableElement } from '../../utils/dom';
import {
	getBlockEventHandlers,
	subscribeEventTypes,
	getEventTypes,
} from './editable-root-event-handlers';

/**
 * Backwards compatibility for block event handlers under `editableRoot`.
 *
 * When a block supports `editableRoot`, the writing flow wrapper is the
 * contentEditable editing host, so keyboard, input and composition events
 * target the wrapper instead of the block. React `on*` handlers a third party
 * added to a block through `wrapperProps` (e.g. via an `editor.BlockListBlock`
 * filter) are on the block element, below the target, so they stop firing.
 *
 * The block registers those handlers (see `useBlockProps`), and this hook
 * calls them from the host: it resolves the block that owns the selection and
 * every block ancestor, and invokes each registered handler, mirroring how the
 * event would have bubbled through the block wrappers. Handlers get a copy of
 * the event, not the original, so `stopPropagation` can't interfere with core;
 * `preventDefault` on the copy is mirrored back so the browser and core honor
 * it.
 *
 * This does not cover handlers a filter puts on its own wrapping element rather
 * than the block's `wrapperProps`; the block element is the supported event
 * surface. It can be removed once input handling is lifted to the host.
 */
export default function useEditableRootEventHandlers() {
	const { hasMultiSelection } = useSelect( blockEditorStore );
	// The event types blocks have handlers for. The host listens for exactly
	// these, re-attaching when the set changes, rather than a fixed list.
	const eventTypes = useSyncExternalStore(
		subscribeEventTypes,
		getEventTypes
	);
	return useRefEffect(
		( node ) => {
			function onEvent( event ) {
				// Only act on real events targeting the host itself, while it
				// is the editing host for a single block.
				if (
					event.target !== node ||
					! event.isTrusted ||
					node.contentEditable !== 'true' ||
					hasMultiSelection()
				) {
					return;
				}

				const selection = node.ownerDocument.defaultView.getSelection();

				if ( ! selection.rangeCount ) {
					return;
				}

				const editable = getSelectionEditableElement( selection, node );
				let blockElement = editable?.closest( '[data-block]' );

				// A copy so an extension's `preventDefault` / `stopPropagation`
				// act on the copy, not the original the browser and core use.
				// `target`/`currentTarget` are null on an undispatched event,
				// so set them to what a bubbling event would report.
				let copy;
				function getCopy() {
					if ( ! copy ) {
						copy = new event.constructor( event.type, event );
						Object.defineProperty( copy, 'target', {
							value: editable,
							configurable: true,
						} );
					}
					return copy;
				}

				// Call the handler of the selected block and of each block
				// ancestor, innermost first, like a bubbling event.
				while ( blockElement && node.contains( blockElement ) ) {
					const handler =
						getBlockEventHandlers( blockElement )?.[ event.type ];

					if ( handler ) {
						Object.defineProperty( getCopy(), 'currentTarget', {
							value: blockElement,
							configurable: true,
						} );
						handler( copy );
					}

					blockElement =
						blockElement.parentElement?.closest( '[data-block]' );
				}

				if ( copy?.defaultPrevented ) {
					event.preventDefault();
				}
			}

			const unsubscribers = eventTypes.map( ( type ) => {
				node.addEventListener( type, onEvent, true );
				return () => node.removeEventListener( type, onEvent, true );
			} );
			return () =>
				unsubscribers.forEach( ( unsubscribe ) => unsubscribe() );
		},
		[ hasMultiSelection, eventTypes ]
	);
}
