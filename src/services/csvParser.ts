import Papa from 'papaparse';
import {ImportResult, JlptLevel, VocabularyInput} from '../types/vocabulary';
import {duplicateSignature, normalizeJlptLevel} from '../utils/vocabulary';

const REQUIRED_HEADERS = ['jlpt_level', 'chapter', 'session', 'word', 'kana'];

type CsvRow = Record<string, string | undefined>;

export type ParsedVocabularyCsv = {
  words: VocabularyInput[];
  result: ImportResult;
};

const cleanHeader = (header: string): string => header.replace(/^\uFEFF/, '').trim().toLowerCase();
const cleanRequiredValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const keepValue = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

export const parseVocabularyCsv = (content: string, selectedLevel: JlptLevel): ParsedVocabularyCsv => {
  const parsed = Papa.parse<CsvRow>(content.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: cleanHeader,
  });

  const headers = parsed.meta.fields?.map(cleanHeader) ?? [];
  const missingHeaders = REQUIRED_HEADERS.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV 缺少必需表头：${missingHeaders.join(', ')}`);
  }

  const messages: string[] = [];
  const words: VocabularyInput[] = [];
  const signatures = new Set<string>();
  let skipped = 0;
  let duplicates = 0;
  let levelMismatch = 0;
  const failed = parsed.errors.length;

  parsed.errors.forEach(error => {
    messages.push(`第 ${error.row ?? '未知'} 行解析失败：${error.message}`);
  });

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const normalizedLevel = normalizeJlptLevel(row.jlpt_level);
    const chapter = cleanRequiredValue(row.chapter);
    const session = cleanRequiredValue(row.session);
    const word = cleanRequiredValue(row.word);
    const kana = cleanRequiredValue(row.kana);

    if (!normalizedLevel) {
      skipped += 1;
      messages.push(`第 ${rowNumber} 行跳过：JLPT 等级无效`);
      return;
    }

    if (normalizedLevel !== selectedLevel) {
      skipped += 1;
      levelMismatch += 1;
      messages.push(`第 ${rowNumber} 行跳过：等级 ${normalizedLevel} 与所选 ${selectedLevel} 不一致`);
      return;
    }

    if (!chapter || !session || !word || !kana) {
      skipped += 1;
      messages.push(`第 ${rowNumber} 行跳过：缺少必需字段`);
      return;
    }

    const input: VocabularyInput = {
      jlpt_level: normalizedLevel,
      chapter,
      session,
      prefix: keepValue(row.prefix),
      word,
      suffix: keepValue(row.suffix),
      kana,
      romaji: keepValue(row.romaji),
      meaning_zh: keepValue(row.meaning_zh),
      meaning_en: keepValue(row.meaning_en),
      example_jp: keepValue(row.example_jp),
      example_zh: keepValue(row.example_zh),
      example_en: keepValue(row.example_en),
      import_order: words.length,
    };

    const signature = duplicateSignature(input);
    if (signatures.has(signature)) {
      skipped += 1;
      duplicates += 1;
      messages.push(`第 ${rowNumber} 行跳过：文件内重复单词`);
      return;
    }

    signatures.add(signature);
    words.push(input);
  });

  return {
    words,
    result: {inserted: 0, skipped, duplicates, failed, levelMismatch, messages},
  };
};
