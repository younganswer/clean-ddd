export abstract class BaseEntity {
  protected constructor(
    protected readonly _id: number,
    protected readonly _uuid: string,
  ) {}

  get id(): number {
    return this._id;
  }

  get uuid(): string {
    return this._uuid;
  }
}
