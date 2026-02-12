export class ListOrdersByUserSubjectIdQuery {
  constructor(
    public readonly userSubjectId: string,
    public readonly limit: number = 200,
    public readonly offset: number = 0,
  ) {}
}
