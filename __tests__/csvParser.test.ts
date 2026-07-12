import {parseVocabularyCsv} from '../src/services/csvParser';

const header = 'jlpt_level,chapter,session,prefix,word,suffix,kana,romaji,meaning_zh,meaning_en,example_jp,example_zh,example_en';

describe('parseVocabularyCsv', () => {
  it('parses standard CSV', () => {
    const parsed = parseVocabularyCsv(`${header}\nN5,Chapter 1,Session 1,お,茶,を,おちゃを,ocha o,茶,tea,お茶を飲みます,我喝茶,I drink tea`, 'N5');
    expect(parsed.words).toHaveLength(1);
    expect(parsed.words[0].word).toBe('茶');
  });

  it('parses TSV', () => {
    const parsed = parseVocabularyCsv('jlpt_level\tchapter\tsession\tword\tkana\nN5\t1\t2\t水\tみず', 'N5');
    expect(parsed.words[0]).toMatchObject({chapter: '1', session: '2', word: '水'});
  });

  it('handles UTF-8 BOM', () => {
    const parsed = parseVocabularyCsv(`\uFEFF${header}\nN5,1,1,,私,,わたし,watashi,我,I,,,`, 'N5');
    expect(parsed.words).toHaveLength(1);
  });

  it('keeps quoted comma', () => {
    const parsed = parseVocabularyCsv(`${header}\nN5,1,1,,猫,,ねこ,neko,"猫, 小猫",cat,,,`, 'N5');
    expect(parsed.words[0].meaning_zh).toBe('猫, 小猫');
  });

  it('allows empty optional fields', () => {
    const parsed = parseVocabularyCsv('jlpt_level,chapter,session,word,kana\nN5,1,1,犬,いぬ', 'N5');
    expect(parsed.words[0].meaning_en).toBe('');
  });

  it('throws on missing required header', () => {
    expect(() => parseVocabularyCsv('jlpt_level,chapter,word\nN5,1,犬', 'N5')).toThrow('缺少必需表头');
  });

  it('skips invalid jlpt level', () => {
    const parsed = parseVocabularyCsv('jlpt_level,chapter,session,word,kana\nN6,1,1,犬,いぬ', 'N5');
    expect(parsed.words).toHaveLength(0);
    expect(parsed.result.skipped).toBe(1);
  });

  it('skips selected level mismatch', () => {
    const parsed = parseVocabularyCsv('jlpt_level,chapter,session,word,kana\nN4,1,1,犬,いぬ', 'N5');
    expect(parsed.result.levelMismatch).toBe(1);
  });

  it('keeps Chinese and Japanese characters', () => {
    const parsed = parseVocabularyCsv(`${header}\nN5,1,1,お,茶,を,おちゃを,ocha o,茶水,tea,わたしはお茶を飲みます,我喝茶,I drink tea`, 'N5');
    expect(parsed.words[0].example_jp).toContain('お茶');
    expect(parsed.words[0].meaning_zh).toBe('茶水');
  });

  it('skips duplicate rows inside one file', () => {
    const parsed = parseVocabularyCsv('jlpt_level,chapter,session,word,kana\nN5,1,1,犬,いぬ\nN5,1,1,犬,いぬ', 'N5');
    expect(parsed.words).toHaveLength(1);
    expect(parsed.result.duplicates).toBe(1);
  });
});
