# Admin Editor & Dashboard Redesign

**Date:** 2026-03-08
**Status:** Approved
**Context:** Editorial team workflow

## Overview

Comprehensive redesign of the admin article editor and dashboard to provide a modern, Word-like writing experience and improved editorial workflow management.

---

## Part 1: Article Editor

### 1.1 Layout & Structure

**Header Bar (sticky):**
- Back navigation arrow
- Inline-editable article title (always visible)
- Focus mode toggle button
- Save dropdown (Save Draft / Publish)

**Main Content Area:**
- Document canvas (centered, max-width 720px)
- Floating toolbar (appears near selection)
- Collapsible sidebar with tabs

**Sidebar Tabs:**
- Status (workflow state)
- Category (dropdown)
- Featured Image (upload)
- SEO (title, description)
- Tags (comma-separated)

**Status Bar (fixed bottom):**
- Word count
- Character count
- Estimated read time
- Autosave status

**Alerts:**
- Toast notifications (top-right)
- Success: auto-dismiss after 3s
- Error/Warning: requires manual dismiss

### 1.2 Floating Toolbar

**Appearance:**
- Context-aware, appears 8px above text selection
- Smooth fade-in (150ms)
- Disappears on click-away
- Active formatting highlighted

**Toolbar Buttons:**
| Button | Action |
|--------|--------|
| B | Bold |
| I | Italic |
| U | Underline |
| S | Strikethrough |
| H1▼ | Heading dropdown (H1, H2, H3, Paragraph, Code) |
| " | Blockquote |
| = | Callout/highlight box |
| 🔗 | Link (inline popup) |
| ⋯ | More: bullet list, numbered list, divider, table |

### 1.3 Editor Canvas & Typography

**Canvas Styling:**
- Centered document (max-width 720px)
- Paper-like background (#fafafa)
- Subtle drop shadow on focus
- Smooth scroll behavior
- Placeholder: "Start writing..." (fades on focus)

**Typography Specs:**
| Element | Size | Weight | Line-height | Color |
|---------|------|--------|-------------|-------|
| H1 | 32px | 700 | 1.2 | #0f172a |
| H2 | 24px | 600 | 1.3 | #1e293b |
| H3 | 20px | 600 | 1.4 | #334155 |
| Body | 17px | 400 | 1.75 | #1a1a1a |
| Quote | 17px | 400 italic | 1.7 | #64748b |
| Code | 14px | 450 | 1.6 | #0f172a (mono) |

**Spacing:**
- Paragraphs: 1.5em margin-bottom
- Headings: 1.8em margin-top, 0.8em margin-bottom
- Lists: comfortable padding-left

### 1.4 Slash Commands

**Trigger:** Type `/` at start of empty line

**Commands:**
| Command | Result |
|---------|--------|
| `/h1`, `/h2`, `/h3` | Heading levels |
| `/bullet`, `/numbered` | Lists |
| `/quote` | Blockquote |
| `/code` | Code block |
| `/image` | Image upload modal |
| `/table` | 3x3 table |
| `/divider` | Horizontal rule |
| `/callout` | Info callout box |
| `/embed` | YouTube, Twitter, CodePen |

**Behavior:**
- Fuzzy search filtering
- Arrow key navigation
- Enter to select
- Escape to close
- Shows 8 most used at top

**Callout Box:**
```
┌─────────────────────────────────────────┐
│ 💡 Pro tip                              │
│ Highlighted box for important info      │
└─────────────────────────────────────────┘
```

### 1.5 Media Handling

**Image Insertion:**
- Drag & drop → auto-upload with progress
- Paste from clipboard → auto-upload
- `/image` command → upload modal with URL option
- Click image → inline controls

**Inline Image Controls:**
- Replace button
- Resize handles (drag corners, maintains aspect ratio)
- Size presets: Small (25%), Medium (50%), Large (75%), Full (100%)
- Alignment: Left, Center, Right
- Caption field
- Alt text field
- Remove button

**Upload Progress:**
```
┌─────────────────────────────────┐
│  📷 uploading-image.jpg         │
│  ████████████░░░░░░░░  67%      │
└─────────────────────────────────┘
```

**Embeds:**
- YouTube (embedded player)
- Twitter/X (tweet card)
- CodePen (embedded pen)

### 1.6 Focus Mode

**Toggle:**
- Header button: [Focus]
- Keyboard: `Cmd/Ctrl + Shift + F`
- Slash command: `/focus`

**Focus Mode Features:**
- Full-screen canvas (centered, max-width 720px)
- Sidebars slide out smoothly
- Navigation collapses
- Background darkens (#1a1a1a at 50%)
- Only floating toolbar visible
- Optional: Typewriter mode (current line centered)

**Exit:**
- Press Escape
- Press toggle shortcut again
- Click [×] in corner

### 1.7 Status Bar & Feedback

**Status Bar (fixed bottom):**
```
📝 1,247 words · 7,823 chars · ⏱️ ~5 min read · ✓ Saved 3s ago
```

**Autosave States:**
| State | Indicator |
|-------|-----------|
| Saving | `⟳ Saving...` (spinner) |
| Saved | `✓ Saved 3s ago` → `✓ Saved` (fades) |
| Unsaved | `● Unsaved changes` (amber) |
| Error | `⚠️ Save failed - Retry` (clickable) |
| Offline | `📴 Offline - changes queued` |

**Toast Notifications:**
- Success: green, auto-dismiss 3s, optional action link
- Error: red, requires dismiss, shows details
- Warning: amber, optional action button

**Keyboard Shortcuts (`?` to show):**
| Shortcut | Action |
|----------|--------|
| ⌘B | Bold |
| ⌘I | Italic |
| ⌘U | Underline |
| ⌘S | Save |
| ⌘⌥1-3 | Heading 1-3 |
| ⌘/ | Slash menu |
| ⌘⇧F | Focus mode |
| ⌘⇧I | Insert image |

---

## Part 2: Dashboard

### 2.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                    [New Article] [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│  Workflow Pipeline (Kanban)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Articles (left, 60%)     │  Activity Feed (right, 40%)         │
├─────────────────────────────────────────────────────────────────┤
│  Quick Stats + Actionable Alerts                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Workflow Pipeline

**Columns:**
| Status | Meaning | Who can move here |
|--------|---------|-------------------|
| 📝 Draft | Work in progress | Writer |
| 👁️ Review | Ready for editorial review | Writer |
| ✅ Approved | Editor approved, ready to publish | Editor |
| 🚀 Published | Live on site | Editor/Admin |

**Card Details:**
- Title (click to edit)
- Assignee (@username)
- Deadline date
- Category
- Estimated read time
- Progress bar (based on required fields)

**Interactions:**
- Drag cards between columns → status updates
- Click card → opens editor
- Hover → quick actions (assign, set deadline)

### 2.3 Enhanced Article List

**Features:**
- Search bar (title, content)
- Filters: Status, Author, Category, Due date, Date range
- Sortable columns (click header)
- Row checkbox for bulk selection
- Row actions menu (⋮): Edit, Assign, Set deadline, Duplicate, Delete
- Pagination
- View toggle: Compact / Expanded

**Bulk Actions:**
- Assign to team member
- Set status
- Delete

### 2.4 Activity Feed

**Timeline Groups:**
- Now
- Today
- Yesterday
- This Week
- Earlier

**Activity Types:**
| Icon | Activity |
|------|----------|
| 📝 | Created |
| ✏️ | Edited |
| 👁️ | Submitted for review |
| ✅ | Approved |
| 🚀 | Published |
| 🗑️ | Deleted |
| 👤 | Assigned |
| 💬 | Commented |
| 📅 | Scheduled |

**Features:**
- Expandable details (show diff)
- Filter by type
- Unread indicators
- Links to related articles

### 2.5 Quick Stats

**Metric Cards:**
- Total articles
- Drafts count
- In Review count
- Due Today count
- Published This Week count

**Actionable Alerts:**
- Overdue articles (red)
- Articles awaiting review (amber)
- Links to take action

**Optional Widgets:**
- Team productivity chart
- Category breakdown

---

## Technical Notes

### New Dependencies
- `@tiptap/extension-placeholder` - Better placeholders
- `@tiptap/extension-typography` - Smart quotes, dashes
- Consider: `tiptap-markdown` for markdown shortcuts
- Consider: `@floating-ui/react` for floating toolbar positioning

### Database Changes
- Add `assignedTo` field to articles
- Add `deadline` field to articles
- Add `status` enum: draft, review, approved, published
- Add activity log table for feed

### Components to Create
- `FloatingToolbar.tsx`
- `SlashCommandMenu.tsx`
- `EditorCanvas.tsx`
- `FocusMode.tsx`
- `EditorStatusBar.tsx`
- `Toast.tsx`
- `WorkflowPipeline.tsx`
- `ArticleCard.tsx`
- `ArticleList.tsx`
- `ActivityFeed.tsx`
- `QuickStats.tsx`
- `ActionableAlerts.tsx`

### Files to Modify
- `src/components/admin/article-editor-form.tsx`
- `src/components/admin/rich-text-editor.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/app/admin/page.tsx`
- `src/lib/types.ts` (add new types)
- `src/lib/content/queries.ts` (add queries for new features)
