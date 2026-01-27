/**
 * Run after Jest is installed. Mocks console methods so expected error paths
 * in the code under test (e.g. catch blocks that log then rethrow) don't
 * clutter test output. Restore in afterAll if you need real console in a test.
 */
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
