const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'node_modules', 'react-native-tts', 'android', 'build.gradle');

if (fs.existsSync(gradlePath)) {
  const original = fs.readFileSync(gradlePath, 'utf8');
  const patched = original.replace(
    /buildscript\s*\{\s*repositories\s*\{\s*jcenter\(\)\s*\}\s*dependencies\s*\{\s*classpath 'com\.android\.tools\.build:gradle:1\.3\.1'\s*\}\s*\}\s*/m,
    '',
  );

  if (patched !== original) {
    fs.writeFileSync(gradlePath, patched);
  }
}
