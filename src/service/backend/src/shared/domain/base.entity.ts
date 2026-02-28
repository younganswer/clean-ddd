export abstract class BaseEntity {
	protected constructor(protected readonly _uuid: string) {}

	get uuid(): string {
		return this._uuid;
	}
}
