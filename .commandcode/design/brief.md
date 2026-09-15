# SUNTEK — Design Brief

> Working design constitution for this repo. One source of truth for future `/design` work.
> Last updated: 2026-09-15 (owner-confirmed decisions folded in)
> Grounded in repo inspection: `frontend/`, `catalog-web/`, `pos-pwa/`, `backend/`,
> `PROJECT_CONTEXT.md`, and `.commandcode/taste/*`.

**Authority.** The decisions in this brief are owner-confirmed. Do **not** infer design
requirements from `.commandcode/taste/*` — Taste records workflow and stack preferences,
not design direction. A design requirement exists only when it is confirmed here.

---

## 1. What this repo is

SUNTEK is an internal ERP plus customer-facing surfaces for a vinyl importer in Bolivia
(currency is Bolivianos, `Bs`; locale `es-BO`) that sells wholesale boxes and retail
meters/units. There is **one backend** and **three front-ends**, each with its own
audience, register, and visual system.

This brief covers all three. A design command should name the app it targets; if it does
not, ask or default to the app whose files are in context.

---

## 2. Register per application

Register is **product** or **brand**, and it changes what is allowed.

| App | Register | Why |
|---|---|---|
| `frontend/` (admin ERP) | **Product** | Staff open it daily; consistency, density and speed beat expression |
| `pos-pwa/` (counter POS) | **Product** | One-handed, in-the-moment selling; speed and target size beat expression |
| `catalog-web/` (public catalog) | **Brand** (commercial catalog) | A public commercial catalog surface, not an application UI. Its job is to present SUNTEK's products compellingly enough to drive a WhatsApp contact |

The backend has no visual surface. It does impose product constraints: `Bs` money format,
`es-BO` locale, and a bilingual ES/EN user base for the admin app.

**The two product surfaces are not ranked against each other.** Admin and POS serve
different users under different pressure and are designed on their own terms:

- **POS prioritizes** speed, touch ergonomics, and counter-operator efficiency.
- **Admin prioritizes** information density, clarity, and operational productivity.

Never resolve a conflict by borrowing the POS's touch ergonomics into the admin console,
or the admin's density into the POS.

---

## 3. Users and context

- **Admin / warehouse staff** (Operator, Admin). Desktop-first, seated, doing repetitive
  data work: stock levels, opening boxes, recording sales, exports. Under mild time
  pressure. They know the product codes; they want fewer clicks and more on screen.
- **Counter / storefront operator.** Standing, one hand on a phone, customer in front of
  them. Highest pressure of any user. Any hesitation is a queue.
- **Public customer / reseller.** Arrives from a link or WhatsApp, probably on a phone,
  browsing films and tools. Wants to understand the material's price, specs and
  availability, and how to contact SUNTEK. Low patience, no account. Spanish-first;
  English selectable.

---

## 4. Product purpose and the main job per surface

- **Admin ERP** — run warehouse and storefront stock, sales, and users. Dominant job:
  **operate** inventory and read status at a glance.
- **POS PWA** — complete a multi-item counter sale and close the day's cash. Dominant
  job: **operate** a ticket, then **monitor** the arqueo.
- **Public catalog** — present SUNTEK's products clearly and make people interested
  enough to contact SUNTEK. Dominant job: **explore**, ending in one **decide** action:
  message SUNTEK on WhatsApp about availability or a quote. No cart, no checkout, no
  account.

---

## 5. Business and domain constraints (catalog-critical)

Non-negotiable facts about what SUNTEK does, and does not do. They constrain the public
catalog's imagery, copy, CTAs, and product presentation.

- **What SUNTEK sells:** window film / vinyl material **in rolls**, plus related tools and
  accessories. The product being sold is the material.
- **What SUNTEK does not do:** SUNTEK does **not** provide installation services, and
  does **not** control or know the customer's final installation or use.
- **So the catalog presents the material,** not a service outcome: rolls, packaging,
  samples, finishes, dimensions, technical characteristics, and availability.
- **Never portray SUNTEK as an installer.** Avoid installation-service language
  entirely — booking, scheduling, appointments, "our installers", "we install",
  "request an installation".
- **The commercial action is a conversation, not a transaction.** Every catalog CTA leads
  to WhatsApp to ask about **availability or request a quote**.
- **There is no ecommerce.** No cart, no checkout, no payment flow, no order tracking.
  Do not design toward one.

---

## 6. Composition lanes by work pattern

Composition follows the work, not a house template. Do not collapse every screen into a
centered hero + card grid + pill buttons.

- **Monitor** — Dashboard KPI strip, POS Daily Closure / arqueo. Status board, live
  priority, plain numbers with clear units.
- **Operate** — Inventory warehouse/storefront tabs, POS sales ticket. Command bar,
  dense rows, direct manipulation, the primary action always in reach.
- **Compare** — Sales movements table, Users table. Stable scanning lanes, aligned
  columns, predictable row rhythm.
- **Configure** — Users, Settings. Grouped fields, a clear commit area.
- **Decide** — Login, and the catalog's single WhatsApp action. One focused action,
  minimal distraction.
- **Explore** — Public catalog. Search, filters, gallery, reversible discovery, ending in
  a contact path.

A screen has one dominant pattern; the supporting patterns must not compete with it.

---

## 7. Voice

- **Language:** technical implementation in **English** (identifiers, code, comments,
  docs). User-facing copy is **Spanish** by default. `catalog-web` is **bilingual**:
  Spanish is the default, English is available through a user-selectable toggle in the
  header. This is an **approved product requirement**, not an inferred capability; the
  missing i18n must be implemented, and the absence of i18n today is not a reason to
  defer it. The admin app also offers ES/EN. `pos-pwa` remains Spanish only.
- **Tone:** plain, operational, precise. The ERP copy should read like a competent
  colleague, not a marketing deck. The catalog may be warmer and more inviting, but it
  still speaks about the material and its characteristics, never about services.
- **Money:** always `Bs` with exactly 2 decimals (`Bs 10.00`), locale `es-BO`. Never `$`.
- **Numbers:** use `tabular-nums` wherever figures line up in a column or animate.
- **Buttons:** one verb, sentence case ("Registrar venta", "Abrir caja"). No exclamation
  points.
- **Catalog copy** describes the product and the material (roll, finish, dimensions,
  technical characteristics, availability). It never offers installation or service.

---

## 8. Anti-references (drift to refuse)

- **Generic AI SaaS:** cream or slate background, violet-to-indigo gradient CTA, floating
  dashboard with three identical stat cards and a purple accent. The admin app already
  sits close to this; do not amplify it.
- **Stock Shadcn/Vercel clone.** The admin shell is inspired by that standard but should
  read as SUNTEK, not as a template with a logo swapped in.
- **Porting the admin's violet ERP palette into the POS or the catalog.** Each app has
  its own color identity on purpose; do not unify them.
- **Dark-mode-as-default everywhere.** Only the POS is dark. The admin is light; the
  catalog is light.
- **Decorative motion, bounce/elastic easing, parallax.** This is money and stock; motion
  should communicate state, never perform.
- **Icons from more than one set.** `lucide-react` is the only icon source.
- **Feature amputation on small screens.** The POS proves the mobile path works; "not
  available on mobile" is a bug.
- **Installer framing.** Anything implying SUNTEK installs, schedules, or services the
  product: booking CTAs, crew photos, "our team will install", service appointments.
  SUNTEK sells the material; the customer owns the installation.

---

## 9. Design principles for this system

1. **The number is the interface.** Stock, price, total, change. Make the figures legible
   and correctly formatted before adding anything decorative.
2. **One primary action per screen,** placed where the user's hand or cursor already is.
3. **Consistency is the feature in Product surfaces.** Same card, same badge, same
   confirm modal, same toast. Variation between screens is a bug, not a flourish.
4. **Design all nine states.** Idle, hover, active, focused, loading, empty, error,
   disabled, overflow. The ERP's users hit loading and empty constantly; they are not
   edge cases.
5. **Reversibility over confirmation.** Prefer undo. Reserve the confirm modal for
   destructive or financial actions (the project already requires this).
6. **Density with air.** Data-heavy tables, but every spacing step is deliberate
   (`1 / 4 / 9` rhythm: 4px, 16px, 36px).
7. **Each app keeps its own palette.** Shared principles, separate visual systems.
8. **On the catalog, the product is the hero.** The material, its packaging, finishes and
   dimensions carry the page; there is no service to sell and no checkout to drive.

---

## 10. Accessibility expectations

Non-negotiable, and mostly free if the platform is not fought.

- **Touch targets:** minimum 44×44px, comfortable 48×48px. Critical in the POS.
- **Focus:** `:focus-visible` only; never `outline: none` without a visible replacement;
  visible focus through the whole keyboard path in the admin tables and modals.
- **Native first:** `<button>` for actions, `<a href>` for navigation, never `<div onClick>`.
- **Modals** trap focus, `inert` the background, and restore focus to the trigger.
- **Never color alone:** stock/status badges pair color with text or an icon.
- **iOS Safari zoom:** inputs must be ≥16px below 640px. Never suppress with
  `maximum-scale=1`.
- **Zoom/reflow:** must survive 200% zoom and reflow at 320px. No fixed heights on text.
- **Reduced motion:** honour `prefers-reduced-motion`; the POS animations in particular
  must degrade to instant.
- **Money and state announced in text**, not only in a colored chip.

---

## 11. Visual foundation (as it exists today — respect it)

Three deliberate, distinct systems. Do not blend them.

**`frontend/` — Admin ERP (Product, light)**
- Tailwind CSS v4, CSS-first. Only theme token: `--font-sans: Inter`.
- Canvas `bg-slate-50`; surfaces white cards `rounded-xl border border-slate-200
  bg-white shadow-sm`.
- Shell: collapsible dark `bg-zinc-950` sidebar, sticky header, KPI strip.
- Accents: **violet-600** for ERP chrome/primary; **indigo-600** on older auth/form
  buttons; **emerald** for sales/stock health.
- Icons `lucide-react`; toasts `sonner`; skeletons via `animate-pulse`.
- Feels: a professional internal tool. Optimize for density and speed.

**`catalog-web/` — Public catalog (Brand, light)**
- Brand tokens from the logo: primary **`#002D9C`** (azul rey), secondary **`#009DDF`**
  (cielo), muted surface `#f5f7fc`, body text `#334155`.
- **Color hierarchy (final, owner-approved):** brand blue `#002D9C` is reserved for
  intentional brand emphasis and primary actions — the SUNTEK wordmark, the main `h1`,
  active states, and primary WhatsApp actions. Product titles, section headings,
  specifications, metadata and prices use the strong neutral text hierarchy
  (`--text-strong` / `--text`) unless there is a specific semantic reason for brand blue.
  Blue stays an accent; it is never the default text color.
- System font stack (no Inter here). Clean neutral/light page background; no decorative
  gradient.
- Bilingual: Spanish default, English via a header toggle (`es` / `en`).
- Surfaces are white and airy.
- **Media behavior (final, owner-approved):**
  - When `imageUrl` exists, **real product photography is the visual hero** and occupies the
    media area.
  - When `imageUrl` is absent, **do not reserve an image-sized placeholder** and **do not
    expose missing-photo copy to customers**. Missing photography is an implementation/data
    condition, not product information.
  - The no-image state **collapses to the compact typographic product specification
    layout**: product name as the main element, then SKU, roll format/dimensions, prices
    and the WhatsApp action, using typography, whitespace and thin rules for hierarchy.
    No placeholder surface, badges, pills, gradients, shadows or invented material graphics.
  - Each piece of information appears **once** — do not duplicate SKU or dimensions across
    the media area and the specification block.
  - **Never invent** photography, finish, color, transparency, texture or any other material
    attribute to compensate for missing media.
- One conversion action: a WhatsApp deep link for availability or a quote.
- Feels: a confident brand catalog that sells the material and opens a conversation —
  not a dashboard, not a shop.

**`pos-pwa/` — Counter POS (Product, dark, touch)**
- Brand blue ramp with core **`#0038a8`**; canvas `#09090b` (zinc-950), cards zinc-900.
- System font stack; heavy use of `font-black` / `font-bold`, `tabular-nums` for money,
  uppercase 10–11px micro-labels.
- Touch-first: safe-area insets (`pt-safe`/`pb-safe`), no hover reliance, no text
  selection, tactile press states, haptic feedback.
- Feels: a fast, physical terminal. Optimize for speed and thumb reach.

---

## 12. Component and interaction rules

- **Styling is Tailwind utility classes only.** No CSS-in-JS, no component kit, no
  `clsx`/`tailwind-merge` — conditional classes are built inline.
- **Icons: `lucide-react` only.**
- **Feedback pattern:** loading state disables the button (prevents double-submit);
  success/error via `sonner` toast; destructive/financial actions behind a confirm modal.
- **Lists:** with the current small dataset, filtering/pagination is solved client-side.
  Do not propose backend changes to solve a list UX problem.
- **Empty and loading states are required,** not optional polish.
- **Auth-gated screens** redirect to login on expiry (the admin uses a session-expired
  modal, not a 403 page).
- **Money component/format:** `Bs` + 2 decimals, `es-BO`, via the shared formatters.
- **POS specifics:** primary actions in the thumb zone (bottom ~25%); destructive actions
  kept out of easy reach; batch/total figures with `tabular-nums`.
- **Catalog CTA:** the only conversion path is a WhatsApp deep link for availability or a
  quote. There is no checkout and no account; do not introduce one.
- **Catalog product presentation:** show rolls, packaging, samples, finishes, dimensions,
  technical characteristics, and availability. Do not use installer or service imagery
  or copy.
- **Catalog language:** Spanish default, English via a header toggle.
  `document.documentElement.lang` must follow the selected locale. `Bs` amounts keep
  `es-BO` formatting in both languages.
- **Public merchandising rules:** do not derive public stock messaging or product ordering
  from `wholesaleQuantity` / `retailQuantity` — internal inventory is not merchandising
  logic. Availability is requested through the WhatsApp CTA, never asserted publicly.
- **Lifecycle visibility is unresolved.** Do not expose Discontinued / Archived products or
  status labels publicly yet.

---

## 13. Open question (unconfirmed — correct me and I will fold it in)

- **Canonical brand blue is unresolved.** Near-neighbours exist across the apps
  (`#002D9C` in the catalog, `#0038a8` in the POS, and the logo-derived family). Do not
  assume these are intentional variants — they may simply reflect implementation history.
  Treat a single canonical SUNTEK brand blue as an open question until the owner confirms
  one.

---

## 14. Reference sites (catalog-web only)

External references to consult for catalog-web design work. **Extract principles only** —
never copy layouts, branding, assets, photography, copy, trade dress, or proprietary
content. Where a reference conflicts with this brief, **this brief wins**. A feature
existing on a reference site is not a reason to add it to SUNTEK.

| Reference | URL | Study for |
|---|---|---|
| 3M Bolivia — Window Films | https://www.3m.com.bo/3M/es_BO/p/c/films-sheeting/window/ | product hierarchy; variant presentation; technical product info; how a large material manufacturer organizes its catalog |
| Avery Dennison — Architectural Window Films | https://graphics.averydennison.com/en/home/graphics-products/window-films/architectural-window-films.html | product families; category-specific specifications; technical differentiation between film types; material-oriented information architecture |
| Avery Dennison — Window Film Product Resources | https://graphics.averydennison.com/en/home/resources-and-learning/product-resources/window-films-resources.html | product families; category-specific specifications; technical differentiation; material-oriented information architecture |
| Decorative Films / SOLYX — Architect Resources | https://www.decorativefilm.com/architect-resources | physical samples and swatches; rolls and packaging; finish, transparency, texture and color presentation; material-focused photography |
| Solar Gard — Product Resources | https://www.solargard.com/resources/ | specification organization; product families; technical documentation patterns |
| LLumar — Architectural Window Film | https://llumar.com/en/coverage/architectural-film/ | **ONLY** editorial composition, photography quality, visual hierarchy, and breathing room |

**LLumar caveat:** LLumar frequently frames products around installation and dealer
services. Do **not** carry that framing into SUNTEK — SUNTEK sells the material and
provides no installation services (see §5).

### Extracted principles (catalog-web)

Principles drawn from the §14 references and filtered against this brief. References
corroborate; they never override, and no reference feature is imported unless the brief
already calls for it. Each principle is tagged as a **verified pattern** (observed on the
reference sites) or a **SUNTEK rule** (our own decision, sometimes rejecting a reference
convention).

1. **Photograph the material.** Every reference leads with the film itself or the film in
   a real window. SUNTEK should show the roll, the packaging, a finish close-up, and the
   swatch (brief §5). *(verified pattern)*
2. **Preserve SUNTEK's real product naming.** Physical attributes such as dimensions,
   presentation, thickness, finish, tint/opacity, or interior/exterior use may support the
   product name when the actual SUNTEK data provides them, but do not invent a
   specifier-style naming convention or rename products based on reference-site
   conventions. *(SUNTEK rule; the reference naming convention is explicitly not adopted)*
3. **Group by function, not by price.** Solar control / safety / decorative / specialty is
   the industry spine (Avery, Solar Gard); SUNTEK groups by what it actually stocks.
   *(verified pattern)*
4. **Variants differ by physical attributes** — thickness, interior/exterior, dimensions,
   tint/opacity — not by marketing names. *(verified pattern)*
5. **Specs are labeled attributes with units.** Present only attributes SUNTEK actually
   has. *(verified pattern)*
6. **Lifecycle state is a domain concern, not automatically a public-catalog element.**
   Do not expose Discontinued or Archived products/statuses merely because reference sites
   do. Public visibility of lifecycle states remains a product decision. *(SUNTEK rule)*
7. **Two densities exist; pick the image-led one.** Manufacturer spec libraries are dense
   and document-centric (Avery, Solar Gard); consumer pages are image-led (3M, LLumar).
   SUNTEK's WhatsApp-arriving customer needs the image-led mode. *(verified pattern;
   the choice of image-led is SUNTEK inference)*
8. **One idea per section, one CTA, generous whitespace.** *(verified pattern, LLumar scope
   only)*
9. **Do not import:** cart/checkout, sample-ordering, dealer/installer locators or
   installation framing, CSI/PDF spec libraries (brief §5). *(SUNTEK rule)*
