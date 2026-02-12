export abstract class BaseEntity<TId extends string | number | null = string> {
  protected constructor(
    protected readonly _id: TId,
    protected readonly _uuid: string,
  ) {}

  get id(): TId {
    return this._id;
  }

  get uuid(): string {
    return this._uuid;
  }
}
