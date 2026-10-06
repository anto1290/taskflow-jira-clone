# Jira-Clone — Frontend Component Architecture

## 1. Component Tree / Hierarchy

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (html/body + portal root)
│   ├── login/page.tsx            # Guest route — login form
│   ├── register/page.tsx         # Guest route — registration form
│   └── projects/
│       ├── page.tsx              # Project list (cards grid + create modal)
│       └── [id]/board/page.tsx   # Kanban board per project
│
├── components/
│   ├── Button.tsx                # Primary / Secondary / Ghost / Danger + IconButton
│   ├── IssueCard.tsx             # Draggable issue card (issue type, priority, labels, avatar)
│   ├── KanbanBoard.tsx           # dnd-kit board with 4 columns (TODO→DONE)
│   ├── Modal.tsx                 # Reusable modal (focus trap, backdrop, sized)
│   ├── Portal.tsx                # React.createPortal wrapper
│   └── RouteGuards.tsx           # ProtectedRoute & GuestRoute wrappers
│
├── layouts/
│   ├── index.tsx                 # Sidebar + Header exports
│   ├── AppLayout.tsx             # Full app shell (sidebar + header + main)
│   └── BoardLayout.tsx           # Board-page wrapper (protected + header)
│
├── hooks/
│   └── useApi.ts                 # TanStack Query hooks (auth, projects, issues, sprints)
│
├── stores/
│   └── index.ts                  # Zustand stores: auth, projects, issues
│
├── types/
│   └── index.ts                  # All TypeScript interfaces + DTOs + query params
│
└── middleware.ts                 # Next.js middleware (token forwarding stub)
```

### Layout nesting

```
<RootLayout> (app/layout.tsx)
  <GuestRoute>  ──▶  /login  /register
  <ProtectedRoute>
    <AppLayout> (Sidebar + Header + <main>)
      <BoardLayout> (optional wrapper adding title/search/actions)
        ProjectsPage          → /projects
        ProjectBoardPage      → /projects/[id]/board
```

---

## 2. State Management (Zustand)

Three persisted/non-persisted stores live in `stores/index.ts`:

| Store | Persistence | Key actions |
|-------|-------------|-------------|
| `useAuthStore` | `persist` (localStorage key `jira-auth`) | `login`, `logout`, `updateDisplayName` |
| `useProjectsStore` | In-memory | `setProjects`, `addProject`, `updateProject`, `removeProject`, `setActiveProject` |
| `useIssuesStore` | In-memory | `setIssues`, `addIssue`, `updateIssue`, `moveIssue`, `setSelectedIssue` |

> `ponytail:` auth store persists to avoid re-login on refresh; upgrade to httpOnly cookie when backend issues it.

The auth store is the single source of truth for `isAuthenticated`, `user`, and `token`. TanStack Query handles all server-state caching and invalidation.

---

## 3. API Integration (TanStack Query)

All hooks in `hooks/useApi.ts` share one `request<T>()` helper that:
- Reads the JWT from Zustand (`useAuthStore.getState().token`)
- Attaches `Authorization: Bearer <token>`
- Throws on non-2xx with a structured error message

| Hook | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `useLogin` | POST | `/api/auth/login` | Authenticate, persist token |
| `useRegister` | POST | `/api/auth/register` | Register + auto-login |
| `useLogout` | POST | `/api/auth/logout` | Clear session |
| `useUser` | GET | `/api/auth/me` | Current user (staleTime 5 min) |
| `useProjects` | GET | `/api/projects` | List projects (with pagination params) |
| `useProject` | GET | `/api/projects/:id` | Single project detail |
| `useCreateProject` | POST | `/api/projects` | Create + invalidate list |
| `useIssues` | GET | `/api/issues?projectId=…` | Board issues |
| `useIssue` | GET | `/api/issues/:id` | Single issue detail |
| `useCreateIssue` | POST | `/api/issues` | Create + invalidate project issues |
| `useUpdateIssue` | PUT | `/api/issues/:id` | Update + invalidate |
| `useDeleteIssue` | DELETE | `/api/issues/:id` | Delete + invalidate |
| `useSprints` | GET | `/api/sprints?projectId=…` | Sprint list |

---

## 4. Routing Structure (App Router)

| Route | Page | Guard | Description |
|-------|------|-------|-------------|
| `/login` | `app/login/page.tsx` | GuestRoute | Login form |
| `/register` | `app/register/page.tsx` | GuestRoute | Registration form |
| `/projects` | `app/projects/page.tsx` | ProtectedRoute | Project grid + create modal |
| `/projects/[id]/board` | `app/projects/[id]/board/page.tsx` | ProtectedRoute | Kanban board for one project |
| `/issues` | _(future)_ | ProtectedRoute | Full-issue table view |
| `/sprints` | _(future)_ | ProtectedRoute | Sprint management |

All authenticated pages share the `AppLayout` shell (sidebar + header).

---

## 5. Key Component Contracts

### `<Sidebar>`
```tsx
interface SidebarProps {
  items: { id: string; label: string; icon: ReactNode; href: string; badge?: number }[];
  activeId: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}
```
- Width: 264px expanded / 72px collapsed
- Active item gets `border-l-[3px] border-primary-500 bg-primary-500/10`
- User section at bottom (avatar initials + name/email)

### `<Header>`
```tsx
interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}
```
- 56px height, dark surface-900
- Right-aligned: search input (optional) + user dropdown menu

### `<IssueCard>`
```tsx
interface IssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
  draggable?: boolean;   // default true
}
```
- Renders: priority badge, label tags, key+summary, meta row (assignee avatar, estimate, comment count)
- Draggable via HTML5 drag (id set in `dataTransfer`)

### `<KanbanBoard>`
```tsx
interface KanbanBoardProps {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  onMoveIssue?: (issueId: string, newStatus: IssueStatus, newSprintId?: string|null) => void;
}
```
- 4 columns: TODO → IN_PROGRESS → IN_REVIEW → DONE
- Uses `@dnd-kit/core` + `@dnd-kit/sortable` (SortableContext + verticalListSortingStrategy)
- Drag end calls `onMoveIssue(issueId, targetStatus)`

### `<Modal>`
```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';  // max-w-sm / max-w-xl / max-w-3xl
  footer?: ReactNode;
}
```
- Focus trap on open, close on backdrop click
- Portal-rendered into `#portal-root` div in root layout

### `<Button>`
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  // plus all standard <button> props
}
```

---

## 6. Design System Compliance

All colors, spacing, and radii follow `jira-clone-design-system.md`:
- Surface hierarchy: `surface-950` → `surface-900` → `surface-800`
- Typography: Inter family, 4px base grid
- Shadows: `shadow-sm` for cards, `shadow-xl` for modals
- WCAG 2.1 AA: all text/background pairs validated (≥4.5:1 for normal text)

---

## 7. Files Created

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All domain types, DTOs, query param interfaces |
| `src/stores/index.ts` | Zustand stores (auth, projects, issues) |
| `src/hooks/useApi.ts` | TanStack Query hooks for every API endpoint |
| `src/layouts/index.tsx` | Sidebar + Header components |
| `src/layouts/AppLayout.tsx` | Full app shell (sidebar + header + main) |
| `src/layouts/BoardLayout.tsx` | Board-page layout wrapper (protected) |
| `src/components/Button.tsx` | Button variants + IconButton |
| `src/components/Modal.tsx` | Reusable modal with focus trap |
| `src/components/IssueCard.tsx` | Draggable issue card |
| `src/components/KanbanBoard.tsx` | dnd-kit Kanban board |
| `src/components/Portal.tsx` | createPortal wrapper + SkipLink |
| `src/components/RouteGuards.tsx` | ProtectedRoute + GuestRoute |
| `src/app/layout.tsx` | Root layout with portal root |
| `src/app/login/page.tsx` | Login page |
| `src/app/register/page.tsx` | Register page |
| `src/app/projects/page.tsx` | Projects list with create modal |
| `src/app/projects/[id]/board/page.tsx` | Kanban board page |
| `src/middleware.ts` | Auth token forwarding stub |

---

*Architecture document version: 1.0 · 2026-10-05*
