# Household design system

The household space uses Ant Design for controls and dialogs, with Tailwind 4 utilities directly in JSX `className` attributes. Business logic, storage models, imports and synchronization are unchanged by this migration.

## Configuration

- `src/features/home/home.tokens.css` is the single palette and sizing source. Namespaced root variables support body portals without changing other spaces. `html.light` overrides the palette. Its `@theme inline` block exposes semantic utilities such as `bg-home-panel`, `text-home-muted`, `border-home-border`, `rounded-home-control` and `min-h-home-control`.
- `src/features/home/homeTheme.ts` resolves these same variables for Ant's color algorithms and component tokens. Change control height, font, radius and colors in the token file; component-specific Ant behavior belongs in this theme factory.
- `HomeUIProvider` scopes Arabic locale, RTL and Ant configuration to the household subtree and reacts to the application's light/dark toggle. Other spaces do not inherit its Ant theme.

## Shared components

- `HomeInput`, `HomeTextArea`, `HomeSearchInput`, `HomeSelect` and `HomeCompactSearch` use the configured Ant controls. Do not repeat color, border or focus utility sets at call sites.
- `HomeButton` separates visual `variant` from HTML `type`, retaining submission and external `form` associations. Ant's underlying button receives `htmlType`.
- `HomeAntButton` owns button sizing for both the household wrapper and controls using Ant's native API. At widths up to 600px, actions share a 33px minimum height, 11px text and 8px corners, matching the overview recipe action. Icon-only buttons are 33px square; longer text can wrap. Desktop sizing is preserved.
- Icon-only actions pass their SVG through `icon`, with a square touch target and no text-button padding. `HomeCompletion` uses an Ant Checkbox for tasks, shopping, routines and maintenance; its checked state remains controlled by the existing task state.
- `HomeModal` owns the Ant portal, focus, escape handling, scroll bounds and mobile bottom alignment. `HomeWorkflowDialog` delegates to it. Recipe and inventory dialogs retain their existing unsaved-change checks and keyboard handlers.
- `HomeFieldGrid`, `HomePanel` and `HomeStack` cover repeated household layouts. Keep one-off layout with its page instead of creating an abstraction for every utility.
- `KitchenHeader` is shared by recipes and inventory. Inventory keeps its add action and overflow menu on the navigation row; secondary workflows remain in the menu.

Inventory search uses the shared search-mode control, with normalized Arabic search across all data or one selected field. Location/category inputs remain visible at every viewport width, active filters can be cleared, and counts reflect the current search/location/category scope. Attention includes expiry/use-first flags and shortages. Sorting is centralized for table/list/cards; table column headers and the external sort selector control the same sort field/direction. Quantity and expiry sorts keep unknown values last in both directions. List/card results paginate in groups of 12. Table quick entry is collapsible, and all views use the same item status/actions.

## Tailwind in JSX

Inventory keeps location and category side by side on mobile, using two equal min-width-zero columns. Its compact search opts into mobile sizing without changing other callers. Table row actions are direct, labeled icon buttons with tooltips; list/card views retain the overflow menu. Both presentations use the same callbacks and busy/out-of-stock guards.

Page layouts, cards, spacing, colors and responsive/state styles live directly on JSX elements. Repeated patterns live in shared React components, with their literal utility classes on the component's tags. Do not put Tailwind classes into CSS files via `@apply`, or create a separate style map that hides them from the element being customized.

`home.css`, `recipes/recipes.css` and `inventory/inventory.css` contain only ordinary CSS bridges for Ant's internal DOM and the surrounding legacy app shell. Theme variables and the Tailwind 4 semantic configuration remain in `home.tokens.css`. These files contain no `@apply` or `@reference` directives. Some semantic class names remain as accessibility/test/state hooks and as anchors for Tailwind state variants.

Use semantic household colors rather than hardcoded brand colors. Prefer the Ant configuration for library component skins; use Tailwind for structure. Native file input is retained for file selection, and the recipe's rich card uses a semantic HTML button with a separate Ant favorite action, avoiding nested buttons. Date/time fields use Ant Input with native date/time types so existing ISO string values and validation remain compatible.

## Validation

The suite covers 202 scenarios, including household tasks, routines, projects, recipes, inventory and portable data. Inventory presentation tests cover normalized field-specific search, attention flags, non-mutating expiry/recent sorting, ascending/descending quantity/expiry/location sorts and unknown versus zero quantities. Check mobile and desktop viewports and both light/dark modes when changing tokens or shared components.
