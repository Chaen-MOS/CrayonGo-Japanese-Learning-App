import {calculateCurrentStreak} from '../src/utils/studyProgress';

describe('calculateCurrentStreak', () => {
  const now = new Date('2026-08-14T12:00:00.000Z');

  it('counts a streak through today', () => {
    expect(calculateCurrentStreak(['2026-08-14', '2026-08-13', '2026-08-12'], now)).toBe(3);
  });

  it('keeps yesterday as an active streak', () => {
    expect(calculateCurrentStreak(['2026-08-13', '2026-08-12'], now)).toBe(2);
  });

  it('returns zero when the streak has a gap before yesterday', () => {
    expect(calculateCurrentStreak(['2026-08-12'], now)).toBe(0);
  });
});
