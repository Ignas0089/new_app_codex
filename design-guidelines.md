# design-guidelines.md
## Brand voice & tone
- **Voice:** calm, practical, supportive.
- **Tone:** short, direct, friendly.

## Tone guidelines
- Lead with clarity: explain what happens in plain language before any jargon. Every sentence should reinforce the mission to make expense tracking "so simple you’ll actually use it."
- Sound like a trusted budgeting partner—use the second person ("you") to reassure and encourage progress without guilt.
- Celebrate momentum: highlight what’s working ("€120 left") before warnings, keeping the promise of zero cognitive load.
- Use confident verbs ("Save", "Review", "Export") and avoid hedging language ("maybe", "try").
- Maintain calm even in alerts: state the fact, offer the next step ("You’re over by €12. Add a note or adjust the budget."), avoid exclamation marks unless celebrating a milestone.

## UX writing conventions
- **Sentence case** for all headings, buttons, and labels.
- **Currency:** Always prefix with the euro symbol and non-breaking space in UI ("€ 45.90"). Round to two decimals for totals; show one decimal only for charts if space is tight.
- **Dates:** Use `DD MMM YYYY` ("12 Feb 2024") for detail views and `MMM YYYY` for budgets.
- **Actions:** Labels are verbs ("Add expense", "Adjust budget"). Secondary actions use concise nouns ("Export", "Undo").
- **Empty states:** Pair one-line reassurance with a helpful tip ("No expenses yet. Log your first one to see your month take shape.").
- **Tooltips & help:** Keep under 100 characters, start with the benefit ("Keep carry-over on to roll leftover budget into next month.").
- **Microcopy voice:** Avoid slang; contractions are welcome ("You’re", "Don’t").
- **Accessibility:** Every icon-only control requires an aria-label mirroring the visible tone.

## Visual principles
- **Layout rhythm:** Use an 8px spacing grid. Primary sections align to 24px gutters for focus and readability.
- **Color usage:** Neutral background (#F9FAFB), cards (#FFFFFF), dividers (#E5E7EB). Reserve accent color (#2563EB) for primary buttons and highlights.
- **Status colors:**
  - "Healthy" (≤60% of budget): teal #0F766E background tint (#D1FAE5).
  - "Watch" (60–90%): amber #B45309 background tint (#FEF3C7).
  - "Over" (>90%): red #B91C1C background tint (#FEE2E2).
  Use WCAG AA contrast for text over these backgrounds.
- **Typography:**
  - Display/H1: Inter 28px/36px, medium weight.
  - Section title/H2: Inter 22px/30px, medium weight.
  - Body: Inter 16px/24px, regular.
  - Label/Meta: Inter 14px/20px, medium with letter-spacing 0.2px.
- **Charts:** Limit palettes to 6 hues. Use consistent category colors between charts and badges. Provide data labels on hover with value + delta ("€210 • +€15 vs last month").
- **Components:** Buttons use 4px radius, cards 8px radius. Shadows: `0 10px 25px -12px rgba(15, 23, 42, 0.35)` for modals; `0 2px 6px -2px rgba(15, 23, 42, 0.2)` for cards.

## Component quick reference
- **Primary button:** Solid #2563EB background, white text, hover #1D4ED8, disabled #93C5FD.
- **Secondary button:** Border #2563EB, text #2563EB, hover background #DBEAFE.
- **Link text:** #1D4ED8 with underline on hover.
- **Input fields:** 1px border #CBD5F5; focus ring `0 0 0 3px rgba(37, 99, 235, 0.35)`.
- **Badges:** Capsule 16px height. Status colors as above with contrasting text.
- **Tables:** Header row with background #F3F4F6 and medium weight text. Alternate row background #FFFFFF / #F9FAFB.

## Page-specific content & microcopy templates
### Log
- **Purpose:** Fast capture of daily expenses without cognitive overhead.
- **Hero title:** "Log expenses"
- **Primary action button:** "Add expense"
- **Empty state body:** "No expenses yet. Log your first one to see your month take shape."
- **Form helper text:** Under amount field: "Example: € 12.50"
- **Success toast:** "Expense saved. You’re on track."
- **Error toast:** "Couldn’t save. Check the amount and try again."
- **Keyboard hint banner:** "Press `N` to add a new expense anywhere on the page."

### Budgets
- **Purpose:** Show remaining funds and simplify adjustments per category.
- **Hero title:** "Monthly budgets"
- **Primary action button:** "Adjust budgets"
- **Empty state body:** "No budgets yet. Set targets so you know what’s left at a glance."
- **Status badges:** Healthy → "€{remaining} left"; Watch → "€{remaining} left—steady as you go."; Over → "Over by €{overage}. Consider adjusting next month."
- **Inline edit helper:** "Updates apply to {month}."
- **Carry-over toggle copy:** Label "Carry over leftover?" helper "Keeps unused budget for next month."

### Reports
- **Purpose:** Provide quick insight into spending patterns.
- **Hero title:** "Spending reports"
- **Primary tabs:** "Budget vs actual", "Category breakdown", "Trends"
- **Empty state body:** "Add expenses to unlock charts that show how you’re pacing."
- **Insights callout:** "You’ve spent €{amount} less than last month." (show positive first)
- **Over budget alert:** "You’re over by €{overage} in {category}. Review your notes or adjust next month’s budget."
- **Tooltip template:** "{category}: €{amount} this month (↑€{delta} vs last)."

### Settings
- **Purpose:** Manage preferences and safeguard local data.
- **Hero title:** "Settings"
- **Sections:**
  - **Personalization:** "Default month view" description "Start reports on the current or previous month."
  - **Data control:** "Export data" button copy "Download a JSON backup."; "Import data" warning "Importing replaces current data."
  - **Reset:** "Clear all data" confirmation "This removes every expense and budget from this device."
- **Support link:** "Need help? Email support@simpleledger.app"
- **Success toast:** "Settings saved. You’re in control."
- **Destructive action warning:** "This can’t be undone. Make sure you’ve exported first."

## Alignment with mission & promise
- Every interaction should reduce friction: prioritise one-task-per-screen layouts, direct language, and immediate feedback.
- Visual hierarchy mirrors user priorities: capture, review, adjust—matching the mission’s focus on simplicity.
- Microcopy reinforces the promise of calm confidence by highlighting remaining budget before issues and pairing every alert with an action.
- Keep iteration loops tight: if new content feels heavy or directive, rewrite to reassure and guide, not police.
