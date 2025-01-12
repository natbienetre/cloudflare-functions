import type { PluginArgs } from './src/types';

export type { PluginArgs };
export default function (
  args: PluginArgs
): PagesPluginFunction<
  Record<string, string | undefined>,
  string,
  Record<string, unknown>,
  PluginArgs
>;
