# Local secrets

Do not commit files in this folder.

## iOS Firebase (`GoogleService-Info.plist`)

1. Download the iOS plist from the Firebase console (app `com.auxilium.guide`).
2. Save it as `secrets/GoogleService-Info.plist`.
3. `./build-ios.sh` copies it to `ios/App/App/GoogleService-Info.plist` before `cap sync`.

For GitHub Actions later, store the plist contents in a repository secret and write that file before the iOS build.
