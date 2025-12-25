# Base UI Skill

## Purpose
Use Base UI primitives to build accessible, unstyled UI components
styled with Tailwind and project design tokens.

## Usage Rules
- Base UI components must not be wrapped in styled abstractions
- Prefer composition at the call site
- Keep Base UI usage shallow and explicit

## Styling
- Use Tailwind classes directly on Base UI slots
- Do not create global Base UI theme layers
- Rely on CSS variables for color, radius, spacing

## Common Patterns
- Buttons
- Menus
- Popovers
- Toolbars

## References
See `references/base-ui-components.md`
