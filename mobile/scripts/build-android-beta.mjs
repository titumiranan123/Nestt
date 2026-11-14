import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const check = spawnSync(process.execPath, [resolve(root, 'scripts/check-beta.mjs'), 'android'], { stdio: 'inherit', windowsHide: true });
if (check.status !== 0) process.exit(check.status ?? 1);

const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const build = spawnSync(wrapper, ['bundleRelease'], { cwd: resolve(root, 'android'), stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(build.status ?? 1);
