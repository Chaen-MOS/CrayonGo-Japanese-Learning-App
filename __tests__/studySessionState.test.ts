import {clearStudyIndex, loadStudyIndex, saveStudyIndex, studySessionKey} from '../src/services/studySessionState';

const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStore.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStore.delete(key);
    return Promise.resolve();
  }),
}));

describe('studySessionState', () => {
  beforeEach(() => mockStore.clear());

  it('creates stable keys for different study sessions', () => {
    expect(studySessionKey({learningMode: 'session', level: 'N5', chapter: '1', session: '2'})).toBe(
      'labigo.studySession.|session|standard|N5|1|2',
    );
    expect(studySessionKey({learningMode: 'daily', studyMode: 'flashcard'})).toBe('labigo.studySession.|daily|flashcard|||');
  });

  it('saves, loads, clamps, and clears study index', async () => {
    const key = studySessionKey({learningMode: 'daily'});

    await saveStudyIndex(key, 12);
    expect(await loadStudyIndex(key, 5)).toBe(4);
    await clearStudyIndex(key);
    expect(await loadStudyIndex(key, 5)).toBe(0);
  });
});
