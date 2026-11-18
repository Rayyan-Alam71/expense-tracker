# Expense & Income Tracker: Build Specification

> For the AI agent: read this whole file first, then build strictly in the order given in Section 9. The design rules in Section 7 apply to every screen. Do not add features, libraries or routes that are not listed here. Ask before deviating.

---

## 1. Overview

A personal money tracker for one person. The user records every day:
- **Expenses** (about 4 to 10 per day): amount, a category, and a short description.
- **Income** (a few per month, such as rent from tenants): amount, a category, and a description. Rent entries also store the tenant name.

The app shows the running net balance (total income minus total expense) in the header on every page. A dashboard with a calendar lets the user move through any month and any day. It also helps the user see which months spent more on which category, for future planning.

### In scope (v1)
- Add, edit and delete transactions
- Header with net balance up to today
- Dashboard: calendar, daily totals for the selected month, month summary
- Day detail page
- Month transaction list with sorting (amount high to low and low to high) and category filter
- Reports page: month-by-month spending per category for a chosen year
- Add a new category from the UI

### Out of scope (v1)
Login and multiple users, budgets, recurring entries, receipts and uploads, export, charts library, multi-currency, mobile app.

### Assumptions (change these if wrong)
1. Single user, **no authentication**. The app is run privately (local or a private deployment).
2. Currency is **INR (₹)**, displayed with Indian digit grouping (for example 1,25,000).
3. "Net balance" = sum of all income minus sum of all expenses, from the first record up to the given date.
4. "Previous owes" means money that someone owed you and has now paid back. It counts as **income**.
5. Dates are plain calendar dates (no time of day, no timezone logic).
6. **Tailwind CSS** is used for all styling (install and configure it if the scaffold does not have it). No UI component library; the small primitives in Section 7.5 are built by hand.

---

## 2. Tech Stack and Rules

- **Next.js (App Router) with TypeScript**, **Prisma**, **PostgreSQL**. These are already set up. Do not re-scaffold.
- Extra packages allowed (only these): `zod` (validation), `date-fns` (date handling), `lucide-react` (icons), `tsx` (dev dependency, runs the seed script). Install `@prisma/adapter-pg` and `pg` **only if** they are not already in `package.json`.
- **Server vs client**:
  - Pages and the header are **server components** that read from the database directly through a shared helper in `lib/queries.ts`.
  - Route handlers in `app/api` are used only for actions that come from client components (add, edit, delete, filter and sort fetches, add category).
- **Dates**: send and receive as strings `YYYY-MM-DD`. Months as `YYYY-MM`. Store in the database as `@db.Date`. Always build dates in UTC to avoid off-by-one-day bugs.
- **Money**: stored as `Decimal(12,2)`. Convert to a string or number only at the API boundary. Never use floating-point math for totals; do the sums in the database with `aggregate` or `groupBy`.
- **Validation**: every POST and PATCH body is checked with a zod schema. On failure return `400` with `{ "error": "message" }`.
- **Error format**: all errors return `{ "error": "message" }` with the right status code (400, 404, 500).
- **Naming**: files in kebab-case, components in PascalCase, one Prisma client instance in `lib/prisma.ts`.

### Existing scaffold (read this before writing any code)

The project already exists in the folder `nextjs-prisma/` with the App Router at the **project root** (there is **no `src/` folder**). Build on top of it. Do not re-scaffold, move or rename anything that already exists.

1. **Read these files first**: `package.json`, `tsconfig.json`, `prisma/schema.prisma`, `prisma7.config.ts`, `app/layout.tsx`, `app/globals.css`, `postcss.config.mjs`. Follow what they already do.
2. **Prisma 7 setup stays untouched.** Do not change the `generator` block, the `datasource` block, the generated client's `output` path, or how the database URL and driver adapter are wired. Only **add** the enum and models from Section 4.
3. **`lib/prisma.ts` must match the existing setup.** In Prisma 7 the client is usually generated into a custom `output` folder (not `@prisma/client`) and is created with a driver adapter (such as `@prisma/adapter-pg`). Import `PrismaClient` from wherever the generator `output` points, and create it the same way the existing setup expects. Store it on `globalThis` so hot reload in development does not create many connections.
4. **Config file name**: the Prisma config is `prisma7.config.ts` (not the default `prisma.config.ts`). Check `package.json` scripts. If the Prisma CLI needs `--config prisma7.config.ts`, add these npm scripts that include the flag, and use **only these scripts** from then on: `db:generate`, `db:migrate`, `db:seed`, `db:studio`.
5. **After every schema change, run `db:generate`**, and run `db:seed` explicitly. Do not assume migrate does either of them for you.
6. **Seed command**: if `prisma7.config.ts` has no seed command yet, register one there (for example `tsx prisma/seed.ts`), following the shape the file already uses.
7. **Tailwind**: confirm `app/globals.css` imports Tailwind and `postcss.config.mjs` loads the Tailwind plugin. This is most likely Tailwind v4, which has **no `tailwind.config.js`**; put any custom styles in `globals.css`. If Tailwind is missing, install it by following the official Tailwind guide for Next.js.
8. **Next.js version**: check the installed `next` version. In Next.js 15 and newer, `params` and `searchParams` in pages are Promises and must be `await`ed (for example in `app/day/[date]/page.tsx`).
9. **Import alias**: use the alias from `tsconfig.json` (normally `@/*` pointing to the project root), for example `@/lib/prisma`.
10. **Do not touch**: `.env` (never print, copy or commit its values), `.agents/`, `.claude/`, `.windsurf/`, `next.config.ts`, `eslint.config.mjs`. Remove the starter boilerplate from `app/page.tsx` when replacing it with the dashboard. The unused starter images in `public/` may be deleted.

---

## 3. Folder Structure

This is the real project layout, with what to do with each item. `[EXISTING]` means it is already there. `[NEW]` means the agent creates it.

```
nextjs-prisma/
├── app/
│   ├── favicon.ico                  [EXISTING] keep
│   ├── globals.css                  [EXISTING] keep the Tailwind import, add base styles
│   ├── layout.tsx                   [EXISTING] modify: Inter font, <Header />, <ToastProvider />, page title
│   ├── page.tsx                     [EXISTING] replace with the Dashboard
│   ├── day/[date]/page.tsx          [NEW] day detail page
│   ├── reports/page.tsx             [NEW] category-by-month report
│   └── api/
│       ├── categories/route.ts          [NEW] GET, POST
│       ├── transactions/route.ts        [NEW] GET, POST
│       ├── transactions/[id]/route.ts   [NEW] PATCH, DELETE
│       └── reports/route.ts             [NEW] GET
├── components/                      [NEW]
│   ├── Header.tsx                   server component, shows net balance
│   ├── Calendar.tsx                 client component, month grid
│   ├── MonthPicker.tsx              client component, month and year selector
│   ├── TransactionForm.tsx          client component, add and edit
│   ├── TransactionList.tsx          client component, list with sort and filter
│   ├── CategoryFilter.tsx           client component
│   └── ui/                          Button, Card, Modal, Badge, EmptyState, Toast, ConfirmDialog
├── lib/                             [NEW]
│   ├── prisma.ts                    single Prisma client (matches the existing Prisma 7 setup)
│   ├── queries.ts                   shared DB read functions (balance, daily totals, etc.)
│   ├── validators.ts                zod schemas
│   ├── format.ts                    money and date formatting helpers
│   └── theme.ts                     expense / income color tokens (single source of truth)
├── prisma/
│   ├── schema.prisma                [EXISTING] modify: add models only
│   └── seed.ts                      [NEW] default categories
├── prisma7.config.ts                [EXISTING] modify only to register the seed command
├── package.json                     [EXISTING] modify: new dependencies and db:* scripts
├── .env, next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs   [EXISTING] do not touch
├── public/                          [EXISTING] starter images can be deleted
├── .agents/, .claude/, .windsurf/   [EXISTING] do not touch
└── specs.md                         this file
```

---

## 4. Database Schema

Add the following to the existing `prisma/schema.prisma`. Keep its `generator` and `datasource` blocks exactly as they are. If the file already contains placeholder models, ask the user before removing them.

Two tables only. One `Transaction` table holds both expenses and income, separated by a `type` field. This keeps queries and routes minimal.

```prisma
enum TxType {
  EXPENSE
  INCOME
}

model Category {
  id           Int           @id @default(autoincrement())
  name         String
  type         TxType
  transactions Transaction[]

  @@unique([name, type])
}

model Transaction {
  id          Int       @id @default(autoincrement())
  type        TxType
  amount      Decimal   @db.Decimal(12, 2)
  date        DateTime  @db.Date
  categoryId  Int
  category    Category  @relation(fields: [categoryId], references: [id])
  description String?
  tenantName  String?   // only used when the category is "Rent"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([date])
  @@index([type, categoryId, date])
}
```

### Why each part exists
- **Category** table (not a fixed enum): the user can add new categories from the UI without a database migration. Each category belongs to either EXPENSE or INCOME.
- **Transaction.type**: duplicated from the category on purpose, so totals can be calculated without joining tables. It must always match `category.type`; the API enforces this.
- **tenantName**: filled only for Rent income. Required when the category is named "Rent", ignored otherwise.
- **Indexes**: make "all entries of a month" and "category totals of a month" fast.

### Seed data (`prisma/seed.ts`)
Run with the `db:seed` script (see Section 2). The seed file creates its own database client the same way `lib/prisma.ts` does. Use `upsert` so it is safe to run twice.

- **EXPENSE**: Medicine, Doctor, Stationery, Grocery, Electricity Bill, Milkman Bill, Miscellaneous
- **INCOME**: Rent, Salary, Previous Owes, Other

*(This list is a proposal. The user will confirm or extend it. See Section 11.)*

---

## 5. Backend Routes

All routes live in `app/api`. Every response is JSON.

| Method | Path | Purpose | Input | Output |
|---|---|---|---|---|
| GET | `/api/categories` | List categories | query: `type` (optional) | `Category[]` |
| POST | `/api/categories` | Add a new category | body: `{ name, type }` | created `Category`; `409` if the name already exists for that type |
| GET | `/api/transactions` | List transactions | query: `month` (`YYYY-MM`) **or** `date` (`YYYY-MM-DD`); optional `type`, `categoryId`, `sort` | `Transaction[]` with the category name included |
| POST | `/api/transactions` | Add a transaction | body: `{ type, amount, date, categoryId, description?, tenantName? }` | created `Transaction` |
| PATCH | `/api/transactions/[id]` | Edit a transaction | same fields as POST, all optional | updated `Transaction` |
| DELETE | `/api/transactions/[id]` | Delete a transaction | none | `{ ok: true }` |
| GET | `/api/reports` | Monthly spend per category for a year | query: `year` (`YYYY`) | `[{ month: "YYYY-MM", categoryId, categoryName, total }]` (expenses only) |

### Details the agent must follow
- **`sort` values** for `GET /api/transactions`: `amount_desc` (highest first), `amount_asc` (lowest first), `date_desc` (default, newest first). Ties are broken by `id` descending.
- **Validation rules** for POST and PATCH:
  - `amount` must be greater than 0 and have at most 2 decimal places.
  - `date` must be a valid `YYYY-MM-DD`.
  - `categoryId` must exist and its type must match `type`.
  - If the category is "Rent", `tenantName` is required and must not be empty.
  - If the category is not "Rent", ignore and clear `tenantName`.
  - `description` is optional, at most 200 characters.
- **Month filtering** uses `date >= first day of month` and `date < first day of next month`.

### Shared read helpers in `lib/queries.ts` (used by server components, not exposed as routes)
- `getNetBalance(upToDate)`: total income minus total expense for all records with `date <= upToDate`.
- `getMonthSummary(month)`: returns `{ totalIncome, totalExpense, net }` for that month.
- `getDailyTotals(month)`: returns `[{ date, income, expense }]` for every day that has records in that month.
- `getCategoryBreakdown(month)`: returns expense total per category for that month, highest first.

---

## 6. Pages and UI Behaviour

### 6.1 Header (on every page)
- Shows the app name, links to **Dashboard** and **Reports**, and the **net balance up to today**.
- Positive balance is shown in green with the label "Net Earning", negative in red with the label "Net Expense". Show the absolute amount with ₹.
- Includes an **"+ Add"** button that opens `TransactionForm` in a modal.

### 6.2 Dashboard (`/`)
Reads the selected month from the URL query `?month=YYYY-MM` (defaults to the current month). Layout, top to bottom:

1. **Month picker**: previous and next arrows plus a month and year dropdown. Changing it updates the URL.
2. **Month summary cards**: Total Income, Total Expense, Net for the selected month.
3. **Calendar** (placed on the left on desktop, on top on mobile): a standard month grid. Each day cell shows the day's total expense (small, red) and total income (small, green) if any. Clicking a day goes to `/day/YYYY-MM-DD`.
4. **Day-wise totals list** (placed beside the calendar on desktop): one row per day of the month that has records, showing date, expense total and income total. Clicking a row goes to the day page.
5. **Month transactions list** (`TransactionList`): all transactions of the month in a table with columns Date, Category, Description, Amount. Controls above it:
   - **Sort**: Highest first / Lowest first / Newest first.
   - **Category filter**: a dropdown of categories (plus "All"), and a **type toggle**: All / Expense / Income.
   - Sorting and filtering call `GET /api/transactions` and refresh the list.
6. **Category breakdown**: a simple list of expense totals per category for the month, highest first, each with a thin horizontal bar (plain div with a percentage width, no chart library).

### 6.3 Day detail page (`/day/[date]`)
- Shows the date, that day's total income, total expense, and the net balance **up to the end of that day** (using `getNetBalance(date)`).
- Two lists: Expenses of the day and Income of the day. Each row shows category, description, amount (and tenant name for rent), with **Edit** and **Delete** buttons.
- An "+ Add for this day" button that opens the form with the date pre-filled.
- Previous day and next day links.

### 6.4 Add and edit form (`TransactionForm`)
- Fields: Type toggle (Expense / Income), Amount, Date (defaults to today), Category (filtered by the chosen type), Description, Tenant name (shown **only** when the category is "Rent").
- The category dropdown has an **"+ Add new category"** option that asks for a name and calls `POST /api/categories`.
- Because the user enters 4 to 10 entries per day, after a successful save the form **stays open**, keeps the same date and type, clears the amount and description, and focuses the Amount field. A "Done" button closes it.
- After any save, edit or delete, refresh the page data (`router.refresh()`).

### 6.5 Reports page (`/reports`)
- Year selector (defaults to the current year). Calls `GET /api/reports?year=`.
- A table: **rows = categories, columns = Jan to Dec**, each cell the total spent. Last column is the yearly total per category. Last row is the monthly total.
- The highest month in each category row is highlighted. This lets the user see which month spent the most on which sector.
- A category dropdown above the table highlights one row and sorts months of that row from highest to lowest in a small side list ("Top months for Medicine").

---

## 7. Design System and UX Standards

Use **Tailwind CSS only**. The goal is a clean, modern, calm finance UI that is easy to scan quickly. These rules apply to every page and component in Section 6.

### 7.1 The parent color rule (most important)
- **Expense = red. Income = green.** This is the app's core visual language. The type of money decides the color of everything connected to it.
- Red and green are used **only** to mean expense and income (and negative and positive net). Never use them for anything else (for example, do not use green for a generic "Save" button).
- Everything that is not money-specific (navigation, page background, neutral buttons, links) uses **neutral slate** with **indigo** as the brand accent. This keeps red and green meaningful.
- Color is never the only signal. Always add a `+` or `−` sign, a label ("Expense", "Income") or an icon too, so the app stays readable for color-blind users.

### 7.2 Color tokens (`lib/theme.ts`)
Create one object keyed by `TxType`. **Always write the full literal class names** (Tailwind cannot detect classes built by joining strings). Components must read from this object and never hardcode `red-` or `emerald-` classes anywhere else.

| Token | EXPENSE (red) | INCOME (green) |
|---|---|---|
| Amount text | `text-red-600` | `text-emerald-600` |
| Soft background | `bg-red-50` | `bg-emerald-50` |
| Border | `border-red-200` | `border-emerald-200` |
| Left accent bar on rows | `border-l-4 border-red-500` | `border-l-4 border-emerald-500` |
| Badge (category chip) | `bg-red-100 text-red-700` | `bg-emerald-100 text-emerald-700` |
| Solid button | `bg-red-600 hover:bg-red-700 text-white` | `bg-emerald-600 hover:bg-emerald-700 text-white` |
| Focus ring | `focus:ring-red-500` | `focus:ring-emerald-500` |
| Sign shown before amount | `−` | `+` |

Net values (net balance, month net) use the INCOME style when zero or positive and the EXPENSE style when negative.

### 7.3 Where the parent color is applied
- **Header balance pill**: green background and text with the label "Net Earning" when positive, red with "Net Expense" when negative.
- **Month summary cards**: Income card is green-tinted, Expense card is red-tinted, Net card follows the net rule. Each card has a small icon, a label, and a large amount.
- **Calendar cells**: the day's expense total in small red text and income total in small green text. Today has an indigo ring. Days outside the selected month are dimmed. The selected day has a slate-900 filled number.
- **Day-wise totals list and transaction rows**: left accent bar in the type color, category shown as a type-colored badge, amount on the right in the type color with its sign.
- **Category breakdown bars**: red bars (expenses only).
- **Reports table**: a red heat map. Cell background goes from `bg-red-50` to `bg-red-200` by how large the value is compared with the largest value in the table. The highest month in each row also gets bold text. Empty cells show a light gray dash.
- **TransactionForm**: the Expense / Income toggle is a segmented control. When **Expense** is selected, the modal's top border, active toggle, focus rings and Save button turn red. When **Income** is selected they turn green. Switching the toggle changes the color instantly, so the user always knows which kind of entry they are making.
- **Delete buttons**: delete is a destructive action but red means "expense" here, so it must not look like an expense. Use a neutral gray icon button (trash icon) that gets a slate-900 background only inside the confirm dialog.

### 7.4 Look and feel
- **Page**: `bg-slate-50`, text `text-slate-900`, secondary text `text-slate-500`. Content in a centered container `max-w-6xl mx-auto px-4 sm:px-6`.
- **Cards**: `bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6`. Use one card style everywhere.
- **Header**: sticky at the top, white with a bottom border and slight blur (`bg-white/80 backdrop-blur`), height about 64px.
- **Font**: Inter through `next/font/google`. Use `tabular-nums` on every amount so digits line up in columns.
- **Type scale**: page title `text-2xl font-semibold`, card title `text-base font-semibold`, big numbers `text-2xl font-bold`, labels `text-sm text-slate-500`.
- **Spacing**: stick to Tailwind's 4px scale (`gap-4`, `gap-6`, `p-4`, `p-6`). Leave generous white space between sections.
- **Rounding and shadows**: inputs and buttons `rounded-xl`, cards `rounded-2xl`, modal `rounded-2xl shadow-xl`. No heavy shadows.
- **Motion**: small and quick only (`transition-colors duration-150`, modal fade and scale-in about 150ms). Respect `motion-reduce`.
- **Icons**: `lucide-react`, 16 to 20px, one stroke style everywhere.
- **Dark mode**: out of scope for v1.

### 7.5 Reusable primitives (`components/ui`)
Build these small components once and reuse them. Each accepts an optional `type` prop (`EXPENSE` or `INCOME`) that pulls its colors from `lib/theme.ts`.
- **Button**: variants `primary` (indigo), `type` (red or green by `type`), `ghost`, `icon`. Supports a loading state (disabled, shows "Saving...").
- **Card**: the white rounded container from 7.4.
- **Badge**: small rounded chip used for categories and type labels.
- **Modal**: centered on desktop, slides up as a bottom sheet on phones. Dark overlay, closes on Esc and on overlay click, traps focus while open and returns focus to the opener when closed.
- **ConfirmDialog**: small modal asking "Delete this entry?" with Cancel and Delete buttons.
- **Toast**: small message at the bottom center, auto-hides after about 3 seconds, uses `aria-live="polite"`. Text examples: "Expense added", "Entry updated", "Entry deleted".
- **EmptyState**: icon, one-line message and an action button (for example "No entries for this day. + Add one").

### 7.6 UX checklist (must pass on every page)
1. **Mobile first**: design for 375px, then enlarge. On phones the dashboard stacks in this order: month picker, summary cards, calendar, day-wise list, month list. On `lg` screens the calendar and day-wise list sit side by side. Tables become stacked cards on phones, or scroll inside their own container, never the whole page.
2. **Touch targets** are at least 44px high. Calendar day cells are at least 44px tall.
3. **Primary action is always reachable**: the header has an "+ Add" button on desktop. On phones show a floating round "+" button at the bottom right (indigo, above the content, not hiding the last row).
4. **Forms**: every input has a visible label. Amount uses `inputMode="decimal"` and gets focus automatically when the form opens. Errors show in small red text directly under the field, and the form is never cleared on an error. Enter submits, Esc closes.
5. **Feedback**: every save, edit and delete shows a toast. Buttons show a loading state while a request runs. Failed requests show an error toast with the message from the API.
6. **Empty, loading and error states** exist for every list and page section. Never leave a blank area.
7. **Accessibility**: use semantic HTML (`header`, `main`, `nav`, `table`, `button`), visible focus outlines on everything clickable, `aria-label` on icon-only buttons, and text contrast that meets WCAG AA. The calendar days are real buttons or links that work with Tab and Enter.
8. **Orientation**: the active nav link is highlighted, the page title states what is shown (for example "March 2026" or "Tuesday, 18 March 2026"), and the calendar highlights today.
9. **Consistency**: the same amount format, date format (`18 Mar 2026`), spacing and card style on every page.
10. **Speed**: the month list and the calendar update without a full page reload. Switching months must feel instant.

---

## 8. Cross-cutting Rules

- Show amounts as `₹ 1,25,000.50` using `Intl.NumberFormat("en-IN")` through `lib/format.ts`. Use this helper everywhere.
- Empty states: each list shows a short message such as "No entries for this day".
- Loading: use Tailwind `animate-pulse` placeholder blocks for lists and a disabled "Saving..." button for forms. No skeleton libraries.
- Confirm before delete with the `ConfirmDialog` component (Section 7.5), not the browser `confirm()`.
- Do not store or log anything outside the database. No analytics.

---

## 9. Build Order (with a check after each step)

1. **Baseline check, schema and seed**: read the existing files listed in Section 2, add the `db:*` scripts if needed, add the models from Section 4, run `db:migrate` (name the migration `init`), then `db:generate`, then add and run the seed with `db:seed`.
   *Check:* `npm run dev` still starts, and Prisma Studio (`db:studio`) shows 7 expense and 4 income categories.
2. **Library files and design system**: `lib/prisma.ts`, `lib/validators.ts`, `lib/format.ts`, `lib/queries.ts`, `lib/theme.ts`, and the `components/ui` primitives from Section 7.
   *Check:* query helpers run without errors, and a temporary page shows every primitive in both red (expense) and green (income) variants.
3. **API routes**: categories, transactions (list, create, edit, delete), reports.
   *Check:* test each with curl or a REST client, including validation failures (negative amount, Rent without tenant, wrong category type).
4. **Header and layout**: net balance and navigation.
   *Check:* balance changes after adding a record through the API.
5. **TransactionForm**: add and edit, with the Rent tenant field and add-category option.
   *Check:* the form saves entries repeatedly on the same date without closing.
6. **Dashboard**: month picker, summary cards, calendar, day-wise list.
   *Check:* clicking days and switching months works; totals match the database.
7. **Month transaction list**: sort, type toggle, category filter, category breakdown.
   *Check:* sort orders are correct; filters combine properly.
8. **Day detail page**: lists, edit, delete, prev and next day.
   *Check:* net balance up to that day is correct.
9. **Reports page**.
   *Check:* the table matches the sum of the month's transactions for a sample category.
10. **Polish**: run the UX checklist in Section 7.6 on every page at phone width (375px) and desktop width (1280px).

---

## 10. Acceptance Criteria

- [ ] I can add an expense with amount, category and description in under 10 seconds, and add the next one right away.
- [ ] Adding Rent income without a tenant name is rejected; with a tenant name it saves.
- [ ] The header always shows the correct net balance up to today.
- [ ] The dashboard calendar shows the daily totals, and clicking a day opens that day's details.
- [ ] I can switch to any past month and see its days and totals.
- [ ] In a selected month, I can sort expenses from highest to lowest and lowest to highest.
- [ ] I can filter a month by category (for example Medicine) and see only those entries.
- [ ] The Reports page shows, for any year, how much each category cost in each month.
- [ ] Editing or deleting a record updates all totals immediately.
- [ ] Money totals never show rounding errors (for example 0.1 + 0.2 must show 0.30).
- [ ] Every expense is red and every income is green, everywhere (rows, badges, calendar, cards, form, reports), with a +/− sign as well as color.
- [ ] The form switches its accent color to red when Expense is chosen and green when Income is chosen.
- [ ] All pages are usable at 375px width with no sideways scrolling, and the whole app can be used with the keyboard.
- [ ] Saving, editing and deleting always show a visible confirmation (toast), and errors appear next to the field that caused them.

---

## 11. Open Items for the User

1. **Confirm or extend the expense categories.** Proposed extras you may want: Vegetables, Fuel, Transport, Mobile / Internet, Water Bill, Gas Cylinder, Household Repairs, Eating Out, Education.
2. **Confirm or extend the income categories** (currently Rent, Salary, Previous Owes, Other).
3. Is there a **property name** needed along with the tenant name (if you have more than one rental property)?