import type { PluginArgs } from './src/types';

export type { PluginArgs, UserData, UserDataCookieArgs } from './src/types';
export default function (
  args: PluginArgs
): PagesPluginFunction<
  Record<string, string | undefined>,
  string,
  Record<string, unknown>,
  PluginArgs
>;
