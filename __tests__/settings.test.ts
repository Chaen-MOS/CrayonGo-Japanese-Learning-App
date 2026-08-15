import {loadAutoPronunciation, saveAutoPronunciation} from '../src/services/settings';

const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStore.set(key, value);
    return Promise.resolve();
  }),
}));

describe('settings', () => {
  beforeEach(() => mockStore.clear());

  it('enables auto pronunciation by default', async () => {
    expect(await loadAutoPronunciation()).toBe(true);
  });

  it('saves and loads auto pronunciation preference', async () => {
    await saveAutoPronunciation(false);
    expect(await loadAutoPronunciation()).toBe(false);

    await saveAutoPronunciation(true);
    expect(await loadAutoPronunciation()).toBe(true);
  });
});
