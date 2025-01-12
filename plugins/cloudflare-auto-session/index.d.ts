import type {
  PluginArgs,
  SessionSpec,
  CookieSpec,
  CookieData,
} from './src/types';

export default function <Data extends CookieData>(
  args: PluginArgs<Data>
): PagesFunction;

export type { PluginArgs, SessionSpec, CookieSpec, CookieData };
