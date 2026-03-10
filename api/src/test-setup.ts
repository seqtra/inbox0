/**
 * Run after Jest is installed. Mocks console methods so expected error paths
 * in the code under test (e.g. catch blocks that log then rethrow) don't
 * clutter test output. Restore in afterAll if you need real console in a test.
 */
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(jest.fn());
  jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  jest.spyOn(console, 'error').mockImplementation(jest.fn());
});

afterAll(() => {
  jest.restoreAllMocks();
});
