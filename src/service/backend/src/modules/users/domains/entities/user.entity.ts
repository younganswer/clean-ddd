import { BaseEntity } from '../../../../shared/domain/base.entity';

export class User extends BaseEntity<string> {
  private constructor(
    id: string,
    private readonly _subjectId: string,
    private readonly _displayName: string,
    private readonly _email: string,
    private readonly _avatarUrl: string | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {
    super(id, id);
  }

  static rehydrate(input: {
    id: string;
    subjectId: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      input.id,
      input.subjectId,
      input.displayName,
      input.email,
      input.avatarUrl,
      input.createdAt,
      input.updatedAt,
    );
  }

  get subjectId(): string {
    return this._subjectId;
  }

  get displayName(): string {
    return this._displayName;
  }

  get email(): string {
    return this._email;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
