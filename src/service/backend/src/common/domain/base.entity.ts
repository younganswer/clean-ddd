export abstract class BaseEntity {
	protected constructor(protected readonly _id: string) {}

	get id(): string {
		return this._id;
	}
}
