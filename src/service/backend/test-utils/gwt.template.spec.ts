export function given(description: string, fn: () => void) {
  describe(`Given ${description}`, fn);
}
export function when(description: string, fn: () => void) {
  describe(`When ${description}`, fn);
}
export function then(description: string, fn: jest.ProvidesCallback): void;
export function then(description: string, fn: jest.ProvidesCallback): void {
  it(`Then ${description}`, fn);
}
