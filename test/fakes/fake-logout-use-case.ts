/** Fake for `LogoutUseCase` — same `execute()` shape, for presentation-layer tests. */
export class FakeLogoutUseCase {
  executeCallCount = 0;

  async execute(): Promise<void> {
    this.executeCallCount += 1;
  }
}
