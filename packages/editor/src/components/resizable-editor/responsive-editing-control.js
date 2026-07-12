/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Badge, Stack } from '@wordpress/ui';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VIEWPORT_STATE_BY_DEVICE_TYPE } from '../../utils/device-type';
import { unlock } from '../../lock-unlock';

export default function ResponsiveEditingControl( {
	canvasWidth,
	deviceType,
	isResponsiveEditing,
} ) {
	const { setResponsiveEditing, setStyleStateViewport } = unlock(
		useDispatch( blockEditorStore )
	);

	return (
		<Stack
			className="editor-resizable-editor__responsive-editing-control"
			direction="row"
			align="center"
			justify="space-between"
			gap="sm"
		>
			<Button
				variant="secondary"
				size="small"
				isPressed={ isResponsiveEditing }
				onClick={ () => {
					const newIsResponsiveEditing = ! isResponsiveEditing;
					setResponsiveEditing( newIsResponsiveEditing );
					setStyleStateViewport(
						newIsResponsiveEditing
							? VIEWPORT_STATE_BY_DEVICE_TYPE[ deviceType ] ??
									'default'
							: 'default'
					);
				} }
			>
				{ __( 'Responsive editing' ) }
			</Button>
			{ !! canvasWidth && (
				<Badge intent="informational">
					{ sprintf(
						/* translators: %d: canvas width in pixels. */
						__( '%dpx' ),
						canvasWidth
					) }
				</Badge>
			) }
		</Stack>
	);
}
