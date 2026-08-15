# 蜡笔GO

Android-first React Native CLI app for offline Japanese vocabulary learning.

## Stack

- React Native 0.86 with TypeScript strict mode
- React Navigation native stack
- OP SQLite for local vocabulary storage
- React Native Documents Picker for CSV/TSV import
- Papa Parse for CSV/TSV parsing
- React Native TTS for Japanese pronunciation
- React Native Vector Icons

## Local Development

```bash
npm install
npm start
```

Metro is configured to use port `8090`.

In another terminal:

```bash
npm run android
```

The Android development command also uses Metro port `8090`.

## Checks

```bash
npm run typecheck
npm test -- --runInBand
```

## Android Debug APK

The debug profile is configured to bundle JavaScript into the APK, so the generated APK can be installed without Metro.

```bash
cd android
gradlew.bat assembleDebug
```

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install on a connected emulator/device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Run without starting Metro:

```bash
npx react-native run-android --no-packager --port 8090
```

If Gradle picks Java 8 on Windows, use Android Studio's JBR for the command:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cd android
.\gradlew.bat assembleDebug
```

## Generate the keystore

Release builds use a local Android signing key. Generate it from the project root on Windows:

```cmd
keytool -genkeypair -v ^
  -storetype PKCS12 ^
  -keystore android\app\shinchan-go-release.keystore ^
  -alias shinchan-go-key ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000
```

When prompted, enter and confirm your own secure passwords. Do not put the passwords in source code.

## Create local keystore.properties

Create `android/keystore.properties` locally:

```properties
MYAPP_UPLOAD_STORE_FILE=shinchan-go-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=shinchan-go-key
MYAPP_UPLOAD_STORE_PASSWORD=<your local keystore password>
MYAPP_UPLOAD_KEY_PASSWORD=<your local key password>
```

`android/keystore.properties` and `android/app/shinchan-go-release.keystore` are ignored by Git.
Alternatively, provide the same four values as environment variables for CI or a local shell. Release passwords are read at build time and are not hardcoded in `android/app/build.gradle`.

## Build the Release APK

Use Android Studio's JBR and the Android SDK for the current terminal session:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='C:\Users\zicha\AppData\Local\Android\Sdk'
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
java -version
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

## Locate the APK

The signed standalone Release APK is expected at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Install using adb

Install the Release APK on a connected emulator or Android device:

```powershell
C:\Users\zicha\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\release\app-release.apk
```

The Release APK includes the React Native JavaScript bundle and assets, so it opens from its own launcher icon and does not require Metro.

## Security warning

Never commit the release keystore or `android/keystore.properties`. Losing the release keystore or passwords may prevent future app updates under the same signing identity, so keep a secure backup of both the keystore file and the passwords.

## CSV/TSV Import

Required headers:

```text
jlpt_level,chapter,session,word,kana
```

Supported optional headers:

```text
prefix,suffix,romaji,meaning_zh,meaning_en,example_jp,example_zh,example_en
```

The parser supports CSV, TSV, UTF-8 BOM, quoted commas, multiline fields, Chinese, Japanese, English, and header order changes. Rows with missing required values, invalid JLPT levels, level mismatch, or duplicate vocabulary signatures are skipped and counted.

## SQLite Schema

Table: `vocabulary`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `jlpt_level TEXT NOT NULL`
- `chapter TEXT NOT NULL`
- `session TEXT NOT NULL`
- `prefix TEXT`
- `word TEXT NOT NULL`
- `suffix TEXT`
- `kana TEXT NOT NULL`
- `romaji TEXT`
- `meaning_zh TEXT`
- `meaning_en TEXT`
- `example_jp TEXT`
- `example_zh TEXT`
- `example_en TEXT`
- `import_order INTEGER NOT NULL`
- `created_at TEXT NOT NULL`

Indexes:

- `idx_vocabulary_level`
- `idx_vocabulary_level_chapter_session`
- unique key on `jlpt_level, chapter, session, prefix, word, suffix, kana`
