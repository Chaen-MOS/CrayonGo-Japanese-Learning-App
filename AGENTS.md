# 蜡笔GO

Standard React Native CLI Android-first app for offline Japanese vocabulary learning.

## Notes for agents

- Keep TypeScript strict.
- Do not add Expo packages, Expo Router, EAS, Firebase, backend services, or paid APIs.
- Keep SQL in `src/database`, not in screens.
- Keep CSV parsing rules in `src/services/csvParser.ts`; it should stay pure and testable.
- Android package name is `com.labigo.app`.
- App display name is `蜡笔GO`.
