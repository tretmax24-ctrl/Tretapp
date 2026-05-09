# Tretapp Setup Guide

This guide will help you set up the Tretapp video editing application from scratch.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **React Native CLI** - Install with `npm install -g react-native-cli`
- **Watchman** (recommended for macOS) - [Download](https://facebook.github.io/watchman/)

### Platform-Specific Requirements

#### Android Development
- **Android SDK** (API 21+)
- **Android NDK** (for FFmpeg compilation)
- **Android Studio** (recommended)
- **Java Development Kit (JDK)** 11 or higher
- **Gradle** 7.x

#### iOS Development
- **Xcode** 13 or higher
- **CocoaPods**
- **macOS** 11 or higher

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/tretmax24-ctrl/Tretapp.git
cd Tretapp
```

### 2. Install Node Dependencies

```bash
npm install
```

Or with yarn:
```bash
yarn install
```

### 3. Install iOS Pods (macOS only)

If developing for iOS:

```bash
cd ios
pod install
cd ..
```

### 4. Install FFmpeg (Optional but Recommended)

For native FFmpeg support, you may need to compile it for your platform:

```bash
# For Android, FFmpeg will be downloaded during build
# For iOS, CocoaPods will handle the dependency

npm install react-native-ffmpeg
```

### 5. Configuration

#### Android Configuration

1. Create `android/local.properties`:
```properties
sdk.dir=/path/to/android/sdk
ndk.dir=/path/to/android/ndk
```

2. Update Android SDK versions in `android/build.gradle`:
```gradle
compileSdkVersion 33
buildToolsVersion "33.0.0"
```

#### iOS Configuration

1. Update deployment target in `ios/Podfile`:
```ruby
platform :ios, '12.0'
```

### 6. Install Additional Dependencies (Optional)

Some optional packages that enhance functionality:

```bash
# For UUID generation
npm install uuid

# For module resolution
npm install babel-plugin-module-resolver
```

## Running the Application

### Start Metro Bundler

In a terminal window:

```bash
npm start
```

Or:

```bash
react-native start
```

### Run on Android

In another terminal:

```bash
npm run android
```

Or manually:

```bash
react-native run-android
```

**Note**: Requires an Android emulator running or a physical device connected via USB.

### Run on iOS

On macOS:

```bash
npm run ios
```

Or manually:

```bash
react-native run-ios
```

**Note**: Requires Xcode to be installed.

## Troubleshooting

### Common Issues

#### 1. "Metro bundler not found"

**Solution**: Ensure Metro is running in a separate terminal:
```bash
npm start
```

#### 2. "Could not find a valid JDK"

**Solution**: Set JAVA_HOME environment variable:
```bash
export JAVA_HOME=/path/to/jdk
```

#### 3. "CocoaPods requirements not met" (iOS)

**Solution**: Update CocoaPods:
```bash
sudo gem install cocoapods
cd ios && pod repo update && pod install && cd ..
```

#### 4. "FFmpeg compilation errors"

**Solution**: 
- For Android: Clear Gradle cache and rebuild
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

- For iOS: Clear DerivedData
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/Tretapp*
cd ios && pod install && cd ..
```

#### 5. "Permissions denied for camera/gallery"

**Solution**: Grant permissions in device settings:
- Android: Settings → Apps → Tretapp → Permissions
- iOS: Settings → Privacy → Camera/Photos → Tretapp

#### 6. "Out of Memory" errors

**Solution**: Increase heap size for Metro:
```bash
npm start -- --max-workers=1
```

## Development Workflow

### Hot Reload

React Native supports hot reload:
- Android: Press `R` twice or use Menu → Reload JS
- iOS: Press `Cmd + R` or use Menu → Reload

### Debugging

#### Using React Native Debugger

1. Open Chrome DevTools: `Cmd + M` (Android) or `Cmd + D` (iOS)
2. Select "Debug remotely"

#### Using VS Code

1. Install "React Native Tools" extension
2. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "React Native Android",
      "program": "${workspaceFolder}/.vscode/launchReactNativeAndroid.js",
      "type": "node",
      "request": "launch"
    }
  ]
}
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier (if configured)
npx prettier --write src/
```

## Building for Production

### Android APK/AAB

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/
```

### iOS IPA

```bash
xcodebuild -workspace ios/Tretapp.xcworkspace \
  -scheme Tretapp \
  -configuration Release \
  -derivedDataPath build
```

## Environment Variables

Create a `.env` file in the root directory:

```
API_BASE_URL=https://api.example.com
ENABLE_DEBUG=false
LOG_LEVEL=info
```

Access in code:
```typescript
const debugEnabled = process.env.ENABLE_DEBUG === 'true';
```

## Next Steps

1. Review the [README.md](./README.md) for feature documentation
2. Check the [project structure](./README.md#-project-structure)
3. Start editing videos!

## Support

For detailed issues or platform-specific help:

- **Android Issues**: Check `android/build.gradle` and NDK installation
- **iOS Issues**: Check `ios/Podfile` and Xcode settings
- **FFmpeg Issues**: See [react-native-ffmpeg docs](https://github.com/tanersener/react-native-ffmpeg)

## Useful Resources

- [React Native Docs](https://reactnative.dev/)
- [Redux Documentation](https://redux.js.org/)
- [FFmpeg Wiki](https://trac.ffmpeg.org/)
- [React Navigation Docs](https://reactnavigation.org/)

---

**Last Updated**: May 2026  
**Tretapp Version**: 0.0.1
