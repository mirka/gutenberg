/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * TODO:
 *
 * This `selector` idea is bad because:
 * 1) It's fragile - we'll change the class names and unintentionally break the NUG
 * 2) React won't render the NUG when one of the selectors starts matching (e.g. publish button
 *    becomes active)
 *
 * A possibly better idea is to kinda copy how slot-fill works and have EditorProvider provide a
 * context that has:
 *
 * registerGuidePoint : (String, Ref) -> void
 * getGuidePoint : (String) -> Ref
 *
 * Then, when, e.g. the button becomes active <GuidePoint> mounts which calls registerGuidePoint()
 * which then updates this component (because it also subscribes to the context).
 *
 * This should all be done inside <Tip>.
 */

const STEPS = [
	{
		selector: '.editor-inserter__toggle',
		text: __( 'Welcome to the wonderful world of blocks! Click ‘Add block’ to insert different kinds of content—text, images, quotes, video, lists, and much more.' ),
	},
	{
		selector: '.edit-post-header__settings [aria-label="Settings"]',
		text: __( 'You’ll find more settings for your page and blocks in the sidebar. Click ‘Settings’ to open it.' ),
	},
	{
		selector: 'a.editor-post-preview',
		text: __( 'Click ‘Preview’ to load a preview of this page, so you can make sure you’re happy with your blocks. ' ),
	},
	{
		selector: '.editor-post-publish-panel__toggle:not([disabled])',
		text: __( 'Finished writing? That’s great, let’s get this published right now. Just click ‘Publish’ and you’re good to go.' ),
	},
];

class EditorNewUserGuide extends Component {
	constructor( { hasDismissedNewUserGuide } ) {
		this.advance = this.bind( this.advance );

		super( ...arguments );

		this.state = {
			currentStep: hasDismissedNewUserGuide ? null : 0,
		};
	}

	static getDerivedStateFromProps( nextProps ) {
		if ( ! this.props.hasDismissedNewUserGuide && nextProps.hasDismissedNewUserGuide ) {
			return { currentStep: null };
		}

		return null;
	}

	advance() {
		const { currentStep } = this.state;

		if ( currentStep < STEPS.length - 1 ) {
			this.setState( { currentStep: currentStep + 1 } );
		} else {
			this.props.dismissNewUserGuide();
		}
	}

	render() {
		const { currentStep } = this.state;

		const step = STEPS[ currentStep ];
		if ( ! step ) {
			return null;
		}

		return (
			<Tip
				selector={ step.selector }
				text={ step.text }
				onAdvance={ this.advance }
				onDismiss={ this.props.dismissNewUserGuide }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => ( {
		hasDismissedNewUserGuide: select( 'core/editor' ).hasDismissedNewUserGuide(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		dismissGuide() {
			dispatch( 'core/editor' ).dismissNewUserGuide();
		},
	} ) ),
] )( EditorNewUserGuide );
