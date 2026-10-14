/**
 * Placeholder interpolation shared by `t()` and by islands. Islands receive their strings as props (a subtree of the
 * dictionary picked on the server with `strings()`), so client bundles never import whole dictionaries.
 */
export type TranslationParams = Record<string, string | number>;

/** Fill `{name}` placeholders; unknown placeholders are left untouched. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
