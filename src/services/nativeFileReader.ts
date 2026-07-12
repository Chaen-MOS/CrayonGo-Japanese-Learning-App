import {NativeModules} from 'react-native';

type NativeFileReaderModule = {
  readText: (uri: string) => Promise<string>;
};

const NativeFileReader = NativeModules.NativeFileReader as NativeFileReaderModule | undefined;

export async function readTextFile(uri: string) {
  if (!NativeFileReader?.readText) {
    throw new Error('文件读取模块不可用，请重新安装应用后再试。');
  }
  return NativeFileReader.readText(uri);
}
