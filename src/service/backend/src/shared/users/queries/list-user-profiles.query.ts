export class ListUserProfilesQuery {
  constructor(
    public readonly input: {
      limit: number;
      page: number;
    },
  ) {}
}
