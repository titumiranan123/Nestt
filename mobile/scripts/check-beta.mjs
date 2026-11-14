import { existsSync, readFileSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mode = process.argv[2];
if (!['android', 'ios'].includes(mode)) {
  console.error('Usage: node scripts/check-beta.mjs android|ios');
  process.exit(2);
}

const problems = [];
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const webConfig = read('src/config.ts');
const webBaseUrl = webConfig.match(/export const WEB_BASE_URL\s*=\s*['"]([^'"]+)['"]/)?.[1];
let websiteHost;
try {
  const url = new URL(webBaseUrl);
  if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.hostname.endsWith('.example')) throw new Error('not public HTTPS');
  websiteHost = url.hostname;
} catch {
  problems.push('Set WEB_BASE_URL in src/config.ts to the public HTTPS website.');
}

const hasCommand = (command, args = ['--version']) => {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  return !result.error && result.status === 0;
};

if (mode === 'android') {
  const gradle = read('android/gradle.properties');
  const linkHost = gradle.match(/^nesttLinkDomain\s*=\s*(\S+)/m)?.[1];
  if (!websiteHost || websiteHost !== linkHost) problems.push('Set android/gradle.properties nesttLinkDomain to the WEB_BASE_URL hostname.');
  if (!hasCommand('java', ['-version'])) problems.push('Install JDK 17+ and make java available on PATH.');
  const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdkPath || !existsSync(sdkPath)) problems.push('Install Android SDK and set ANDROID_HOME or ANDROID_SDK_ROOT.');
  for (const name of ['NESTT_UPLOAD_STORE_FILE', 'NESTT_UPLOAD_STORE_PASSWORD', 'NESTT_UPLOAD_KEY_ALIAS', 'NESTT_UPLOAD_KEY_PASSWORD']) {
    if (!process.env[name]) problems.push(`Set ${name} for release signing.`);
  }
  const keystore = process.env.NESTT_UPLOAD_STORE_FILE;
  if (keystore) {
    const path = isAbsolute(keystore) ? keystore : resolve(root, 'android/app', keystore);
    if (!existsSync(path)) problems.push('NESTT_UPLOAD_STORE_FILE does not point to an existing keystore.');
  }
} else {
  const project = read('ios/NesttRoomAR.xcodeproj/project.pbxproj');
  const linkHosts = [...project.matchAll(/NESTT_LINK_DOMAIN\s*=\s*([^;]+);/g)].map((match) => match[1].trim());
  if (!websiteHost || !linkHosts.length || linkHosts.some((host) => host !== websiteHost)) problems.push('Set every iOS NESTT_LINK_DOMAIN build setting to the WEB_BASE_URL hostname.');
  if (process.platform !== 'darwin') problems.push('iOS beta archives require macOS with Xcode.');
  else {
    if (!hasCommand('xcodebuild', ['-version'])) problems.push('Install Xcode and select its developer tools.');
    if (!hasCommand('pod', ['--version'])) problems.push('Install CocoaPods and run pod install.');
  }
  if (!/DEVELOPMENT_TEAM\s*=\s*[A-Z0-9]+;/.test(project)) problems.push('Select an Apple signing team for the iOS target in Xcode.');
}

if (problems.length) {
  console.error(`Nestt ${mode} beta preflight found ${problems.length} item(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(`Nestt ${mode} beta configuration is ready for a native release build.`);
