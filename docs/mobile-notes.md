# Mobile design notes (applied 2026-10-31)

Sources read: Nielsen Norman Group "Mobile UX" (content priority, keep chrome
small, essentials first, minimize typing), Apple Human Interface Guidelines
(44x44 pt minimum tap targets, safe-area insets, primary action in the bottom
third, ~16 pt side margins, sheets with a grabber and medium/large heights),
Material 3 bottom sheets (modal sheet with scrim, drag handle, dismiss by tap
outside or swipe, rounded top corners).

Applied:
- Home: 16 px side margins, headline then one primary action, the low-priority
  number card below the action, the image band shortened so the action stays
  near the first screen; all targets >= 44 px tall.
- Call page on phones: the screen fills the viewport inside the safe areas, the
  drawn iOS status bar is hidden because the device shows its own, Home and
  "View agent activity" sit in a 44 px row under the top inset.
- Agent activity on phones: a modal bottom sheet (80% height, 28 px top radius,
  grabber, scrim, tap outside to close, safe-area bottom padding) instead of a
  side drawer; the drawer remains on tablets and desktops.
