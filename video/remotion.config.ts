/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// En el contenedor de producción usamos el navegador ya instalado; en otro equipo
// Remotion descarga el suyo automáticamente.
import {existsSync} from 'node:fs';
const LOCAL_SHELL = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (existsSync(LOCAL_SHELL)) {
  Config.setBrowserExecutable(LOCAL_SHELL);
}
Config.setConcurrency(4);
