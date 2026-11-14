import postcss from 'postcss';

const normalize = value => value.replaceAll('\\', '/');
const featureOf = file => normalize(file).match(/(?:^|\/)src\/features\/([^/]+)\//)?.[1];
const publicEntries = new Set(['index.ts', 'public.ts', 'ui.ts']);

/** Shared by the repository check and its negative/positive policy tests. */
export function boundaryError(importer, target) {
  const from = normalize(importer);
  const to = normalize(target);
  const owner = featureOf(from);
  const destination = featureOf(to);
  if (/\.test\.tsx?$/.test(from)) return null; // Integration tests may inspect internals.
  if (/(?:^|\/)src\/app\/useAppController\.ts$/.test(from) && destination) {
    return 'Application lifecycle must not own space data; compose public integrations in the app shell.';
  }
  if (/(?:^|\/)src\/shared\//.test(from) && /(?:^|\/)src\/(features|app|db|lib|context|components)\//.test(to)) {
    return 'Shared code must not depend on spaces, application state or persistence.';
  }
  if (owner && /(?:^|\/)src\/app\//.test(to)) return 'Spaces must not depend on the application controller.';
  if (destination && destination !== owner) {
    const internal = to.split(`/features/${destination}/`)[1];
    if (!publicEntries.has(internal)) return `Use the ${destination} public entry (index.ts, public.ts or ui.ts), not its internal files.`;
  }
  return null;
}

const legacyStylesheets = new Set([
  'src/index.css', 'src/App.css', 'src/features/today/today.css',
  'src/features/home/home.css', 'src/features/home/recipes/recipes.css',
  'src/features/home/inventory/inventory.css',
]);

export function stylesheetError(file, css) {
  const relative = normalize(file);
  if (/@apply\b/.test(css)) return 'Keep utility classes in JSX; reuse a React component instead of @apply.';
  if (legacyStylesheets.has(relative)) return null;
  if (!relative.endsWith('.tokens.css')) return 'New stylesheets must only define design tokens (*.tokens.css); put component styling in JSX.';
  try {
    let componentStyle = false;
    postcss.parse(css).walkDecls(declaration => { if (!declaration.prop.startsWith('--')) componentStyle = true; });
    if (componentStyle) return 'Token files may only declare CSS custom properties; put layout and visual utilities in JSX.';
  } catch { return 'Invalid token stylesheet.'; }
  return null;
}

