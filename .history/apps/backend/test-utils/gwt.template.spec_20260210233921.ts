export function given(description: string, fn: () => void) {
  describe(`Given ${description}`, fn);
}
export function when(description: string, fn: () => void) {
  describe(`When ${description}`, fn);
}
export function then(
  description: string,
  fn: () => unknown | Promise<unknown>,
) {
  it(`Then ${description}`, fn);
}
