import type {
  PluginArgs,
  SessionSpec,
  CookieSpec,
  CookieData,
} from './src/types';

export default function (args: PluginArgs): PagesFunction;

export type { PluginArgs, SessionSpec, CookieSpec, CookieData };
