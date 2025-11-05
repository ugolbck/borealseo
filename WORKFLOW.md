# Boreal SEO - Content Planning Workflow

## Current Implementation (WRONG)

### Database Structure
- `keywords` table: Stores keywords with search_volume, difficulty, status
- `content_plan` table: Has `scheduled_for` date, `target_keyword` (text), `keyword_id` (optional FK)
- Content plans are created in batches of 7 days
- Keywords are selected by highest search volume from unused pool

### Current Flow
1. User provides 3-5 seed keywords during onboarding
2. System generates up to 100 suggestions per seed (DataForSEO API)
3. Inserts top 50 keywords into database
4. Creates 7 content_plan records with `scheduled_for` dates starting from today
5. Assigns top 7 keywords by search volume to these plans
6. Dashboard displays content plans for date range (yesterday to +5 days)

### Problems
- Only 6 keywords showing (should be 7)
- Yesterday's card shows skeleton (should be empty placeholder)
- No clear distinction between "keyword pool" and "daily assignments"
- Limited keyword pool (50) causes duplicates when refreshing
- No seed keyword tracking for filtering
- Difficulty filter too high (60) - not focused on easy wins

---

## Desired Implementation (CORRECT)

### Core Concept
**Separation of Concerns:**
1. **Keyword Pool**: Large database of researched keywords (100-400 per project)
2. **Daily Assignments**: Specific keyword assigned to each date for each project
3. **Infinite Timeline**: User can scroll through past and future dates
4. **Progressive Assignment**: Keywords assigned 7 days at a time as dates arrive

### Database Structure

#### `keywords` table (KEYWORD POOL)
```sql
id UUID PRIMARY KEY
website_id UUID (FK to websites)
keyword TEXT NOT NULL
search_volume INTEGER
difficulty INTEGER
seed_keyword TEXT  -- NEW: Which user keyword generated this
score INTEGER      -- NEW: Calculated volume/difficulty ratio
status keyword_status_enum ('monitoring', 'target', 'ranking')
is_auto_discovered BOOLEAN
created_at, updated_at
```

#### `content_plan` table (DAILY ASSIGNMENTS)
```sql
id UUID PRIMARY KEY
website_id UUID (FK to websites)
keyword_id UUID (FK to keywords) -- REQUIRED: Always references a keyword
scheduled_for DATE NOT NULL  -- Just the date, not timestamp
status content_plan_status_enum
title TEXT
word_count INTEGER
published_at TIMESTAMPTZ
created_at, updated_at

UNIQUE CONSTRAINT: (website_id, scheduled_for)  -- One plan per day per project
```

### Detailed Workflow

#### Phase 1: Onboarding - Keyword Pool Creation

**User Input:**
- Minimum 3 keywords, maximum 15
- Saved to `websites.initial_keywords` JSONB field

**Keyword Research:**
1. Calculate per-seed limit: `limit = min(100, 400 / seed_count)`
   - 4 seeds → 100 results each = 400 total
   - 8 seeds → 50 results each = 400 total
   - 15 seeds → 26 results each = 390 total

2. For each seed keyword:
   - Call DataForSEO API with limit
   - Filter: `difficulty < 35` (focus on easy wins)
   - Filter: `competition_level IN ('LOW', 'MEDIUM')`
   - Tag each result with `seed_keyword` field

3. Deduplicate and score:
   ```javascript
   score = (searchVolume / 50) + (100 - difficulty)
   // High volume + low difficulty = high score
   ```

4. Select top 200 keywords by score (or all if < 200)

5. Insert into `keywords` table with:
   - `website_id`
   - `keyword`, `search_volume`, `difficulty`, `score`
   - `seed_keyword` (which user keyword generated this)
   - `status = 'target'`
   - `is_auto_discovered = true`

**Result:** 100-400 keywords in pool, top 200 selected, ready for assignment

#### Phase 2: Initial Daily Assignment (First 7 Days)

**When:** Immediately after keyword pool creation during onboarding

**Process:**
1. Get today's date (date only, no time)
2. For i = 0 to 6:
   - Calculate date: `today + i days`
   - Select random unused keyword from pool
   - Create `content_plan` record:
     - `website_id`
     - `keyword_id` (FK to selected keyword)
     - `scheduled_for` (the date)
     - `status = 'planned'`
     - `title` generated from keyword
   - Mark keyword as "used" (it's now in a content_plan)

**Result:** 7 content_plan records created for today through day+6

#### Phase 3: Dashboard Display

**Date Range Logic:**
- Always show today in the center
- Show 3 cards before today (yesterday, day-2, day-3)
- Show 7 cards after today (including today: today through day+6)
- Total: 10 cards visible (3 past + 1 today + 6 future)

**Card States:**
1. **Past dates without assignments**: Empty placeholder (no skeleton)
2. **Dates with assignments**: Full keyword data from `content_plan` JOIN `keywords`
3. **Future dates without assignments**: Empty placeholder (no skeleton)

**Data Fetching:**
```sql
-- Get content plans for date range
SELECT
  cp.id,
  cp.scheduled_for,
  cp.status,
  cp.title,
  k.keyword,
  k.search_volume,
  k.difficulty
FROM content_plan cp
JOIN keywords k ON cp.keyword_id = k.id
WHERE cp.website_id = $website_id
  AND cp.scheduled_for BETWEEN $start_date AND $end_date
ORDER BY cp.scheduled_for ASC
```

**UI Rendering:**
- Create array of 10 date slots
- Match fetched plans to date slots
- Fill gaps with empty placeholders
- Center carousel on today's index (index 3 if showing 3 before)

#### Phase 4: Progressive Assignment (Day 8+)

**Trigger:** User navigates to day 8+ on carousel OR subscription renews to new period

**Check:** Does `content_plan` exist for target date?
- **YES**: Display it
- **NO**: Trigger assignment

**Assignment Process:**
1. Get the target date (e.g., day 8)
2. Find the next 6 dates without assignments
3. For each date:
   - Select random unused keyword from pool
   - Exclude keywords already in `content_plan` for this website
   - Create `content_plan` record
4. Refresh UI to show new assignments

**Pool Exhaustion:**
- If < 7 unused keywords remain:
  - Trigger new keyword research using original seed keywords
  - Generate 100-200 more keywords
  - Continue assignment

#### Phase 5: Keyword Change/Refresh

**User Action:** Click "Change Keyword" on a card

**Process:**
1. Get current `content_plan.keyword_id`
2. Query unused keywords:
   ```sql
   SELECT k.* FROM keywords k
   WHERE k.website_id = $website_id
     AND k.id NOT IN (
       SELECT keyword_id FROM content_plan
       WHERE website_id = $website_id
     )
   ORDER BY k.score DESC
   LIMIT 20
   ```
3. Pick random from top 20
4. Update `content_plan.keyword_id` to new keyword
5. Update `content_plan.title` based on new keyword
6. Return new keyword data to UI

**Result:** New keyword assigned, old keyword back in pool

---

## Key Differences Summary

| Aspect | Current (Wrong) | Desired (Correct) |
|--------|----------------|-------------------|
| Keyword Pool Size | 50 | 100-400 (top 200 selected) |
| Difficulty Filter | < 60 | < 35 (easy wins) |
| Per-seed Limit | 100 fixed | Dynamic (400/seed_count) |
| Seed Tracking | No | Yes (for filtering) |
| Assignment Method | Batch 7 days upfront | Progressive as needed |
| Timeline | Limited range | Infinite scrolling |
| Yesterday Card | Skeleton | Empty placeholder |
| Keyword Reuse | Possible duplicates | Strict uniqueness check |
| Score Calculation | Volume only | Volume/difficulty ratio |

---

## Technical Implementation Notes

### Carousel Behavior
- Not ideal for infinite scrolling
- Consider alternatives:
  - Virtualized list (react-window)
  - Server-side pagination
  - Load more on scroll
- If keeping carousel:
  - Set fixed visible range
  - Update `startIndex` to center today
  - Load adjacent data on navigation

### Date Handling
- Use DATE type in DB, not TIMESTAMPTZ for `scheduled_for`
- Handle timezone conversions client-side
- Always normalize to user's "today" at midnight

### Performance
- Index on `(website_id, scheduled_for)` for fast lookups
- Cache keyword pool counts to avoid repeated queries
- Lazy load content_plan data as user scrolls

### Edge Cases
- User subscribes → unsubscribes → re-subscribes: Keep existing plans
- User changes seed keywords: Regenerate pool or append?
- Article already generated: Lock keyword (prevent change)
- Multiple projects: Separate pools per `website_id`
