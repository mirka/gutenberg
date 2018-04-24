/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getTerms, isRequestingTerms, getEntityRecord, getPost } from '../selectors';

describe( 'getTerms()', () => {
	it( 'returns value of terms by taxonomy', () => {
		let state = deepFreeze( {
			terms: {},
		} );
		expect( getTerms( state, 'categories' ) ).toBe( undefined );

		state = deepFreeze( {
			terms: {
				categories: [ { id: 1 } ],
			},
		} );
		expect( getTerms( state, 'categories' ) ).toEqual( [ { id: 1 } ] );
	} );
} );

describe( 'isRequestingTerms()', () => {
	it( 'returns false if never requested', () => {
		const state = deepFreeze( {
			terms: {},
		} );

		const result = isRequestingTerms( state, 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns false if terms received', () => {
		const state = deepFreeze( {
			terms: {
				categories: [ { id: 1 } ],
			},
		} );

		const result = isRequestingTerms( state, 'categories' );
		expect( result ).toBe( false );
	} );

	it( 'returns true if requesting', () => {
		const state = deepFreeze( {
			terms: {
				categories: null,
			},
		} );

		const result = isRequestingTerms( state, 'categories' );
		expect( result ).toBe( true );
	} );
} );

describe( 'getEntityRecord', () => {
	it( 'should return undefined for unknown record\'s key', () => {
		const state = deepFreeze( {
			entities: {
				root: {
					postType: {
						byKey: {},
					},
				},
			},
		} );
		expect( getEntityRecord( state, 'root', 'postType', 'post' ) ).toBe( undefined );
	} );

	it( 'should return a record by key', () => {
		const state = deepFreeze( {
			entities: {
				root: {
					postType: {
						byKey: {
							post: { slug: 'post' },
						},
					},
				},
			},
		} );
		expect( getEntityRecord( state, 'root', 'postType', 'post' ) ).toEqual( { slug: 'post' } );
	} );
} );

describe( 'getPost', () => {
	it( 'should return undefined for unknown post', () => {
		const state = deepFreeze( {
			posts: {},
		} );
		expect( getPost( state, 10 ) ).toBe( undefined );
	} );

	it( 'should return a post by ID', () => {
		const state = deepFreeze( {
			posts: {
				10: { id: 10 },
			},
		} );
		expect( getPost( state, 10 ) ).toEqual( { id: 10 } );
	} );
} );
