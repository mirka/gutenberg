/**
 * External dependencies
 */
import { keyBy, map, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import entitiesConfig from './entities';

/**
 * Reducer managing terms state. Keyed by taxonomy slug, the value is either
 * undefined (if no request has been made for given taxonomy), null (if a
 * request is in-flight for given taxonomy), or the array of terms for the
 * taxonomy.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function terms( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_TERMS':
			return {
				...state,
				[ action.taxonomy ]: action.terms,
			};

		case 'SET_REQUESTED':
			const { dataType, subType: taxonomy } = action;
			if ( dataType !== 'terms' || state.hasOwnProperty( taxonomy ) ) {
				return state;
			}

			return {
				...state,
				[ taxonomy ]: null,
			};
	}

	return state;
}

/**
 * Reducer managing authors state. Keyed by id.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function users( state = { byId: {}, queries: {} }, action ) {
	switch ( action.type ) {
		case 'RECEIVE_USER_QUERY':
			return {
				byId: {
					...state.byId,
					...keyBy( action.users, 'id' ),
				},
				queries: {
					...state.queries,
					[ action.queryID ]: map( action.users, ( user ) => user.id ),
				},
			};
	}

	return state;
}

/**
 * Reducer managing theme supports data.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function themeSupports( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_SUPPORTS':
			return {
				...state,
				...action.themeSupports,
			};
	}

	return state;
}

/**
 * Higher Order Reducer for a given entity config. It supports:
 *
 *  - Fetching a record by primariy key
 *
 * @param {Object} entityConfig  Entity config.
 *
 * @return {Function} Reducer.
 */
function entity( entityConfig ) {
	const key = entityConfig.key || 'id';

	return ( state = { byKey: {} }, action ) => {
		if (
			! action.name ||
			! action.kind ||
			action.name !== entityConfig.name ||
			action.kind !== entityConfig.kind
		) {
			return state;
		}

		switch ( action.type ) {
			case 'RECEIVE_ENTITY_RECORDS':
				return {
					byKey: {
						...state.key,
						...keyBy( action.records, key ),
					},
				};
			default:
				return state;
		}
	};
}

const entitiesByKind = groupBy( entitiesConfig, 'kind' );
export const entities = combineReducers( Object.entries( entitiesByKind ).reduce( ( memo, [ kind, subEntities ] ) => {
	const kindReducer = combineReducers( subEntities.reduce(
		( kindMemo, entityConfig ) => ( {
			...kindMemo,
			[ entityConfig.name ]: entity( entityConfig ),
		} ),
		{}
	) );

	memo[ kind ] = kindReducer;
	return memo;
}, {} ) );

export default combineReducers( {
	terms,
	users,
	themeSupports,
	entities,
} );
