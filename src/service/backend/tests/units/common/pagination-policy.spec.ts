import {
	normalizeReaderExternalPage,
	normalizeReaderInternalPage,
} from '@/common/cqrs/pagination-policy';

describe('pagination policy', () => {
	it('normalizes external reader paging with capped limit', () => {
		expect(normalizeReaderExternalPage(999, -10)).toEqual({
			limit: 50,
			offset: 0,
		});
		expect(normalizeReaderExternalPage(undefined, undefined)).toEqual({
			limit: 20,
			offset: 0,
		});
	});

	it('normalizes internal reader paging with capped limit', () => {
		expect(normalizeReaderInternalPage(999, -1)).toEqual({
			limit: 200,
			offset: 0,
		});
		expect(normalizeReaderInternalPage(undefined, undefined)).toEqual({
			limit: 50,
			offset: 0,
		});
	});
});
