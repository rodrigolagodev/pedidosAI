# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pedidos is a web application that automates order management and delivery to suppliers in restaurants. Users (kitchen chefs, purchase managers) dictate or type orders via voice/text, which are processed by AI to classify items by supplier and send formatted messages automatically.

**Target users**: Spanish-speaking (Latin America) gastronomic businesses
**Current phase**: Definition and planning (pre-development)

## Documentation System

### Primary References

- @PROJECT_CONTEXT.toon - Main project context and domain knowledge
- @TOON_REFERENCE.md - TOON format specification for .toon files

### Guidelines (Progressive Loading)

- @.claude/guidelines/INDEX.toon - **Load this first** to find relevant guidelines

The INDEX contains all 32 guidelines organized by category with IDs and topics.
Load specific guidelines on-demand using the paths from the index.

**How to use:**

1. Consult INDEX.toon to find the guideline ID or topic you need
2. Load only that specific guideline: `@.claude/guidelines/[category]/[file].toon`
3. Use guideline IDs for cross-referencing

**Quick topic lookup** (from INDEX, load with @):

- naming → `code-naming` → `.claude/guidelines/03-code-standards/3.1-naming-conventions.toon`
- typescript → `code-typescript` → `.claude/guidelines/03-code-standards/3.3-typescript-guidelines.toon`
- components → `pat-react` → `.claude/guidelines/04-patterns/4.1-react-nextjs-patterns.toon`
- database → `pat-supabase` → `.claude/guidelines/04-patterns/4.2-supabase-patterns.toon`
- security → `qual-security` → `.claude/guidelines/05-quality/5.2-security-standards.toon`
- testing → `qual-testing` → `.claude/guidelines/05-quality/5.1-testing-standards.toon`
- ai/voice → `pat-ai` → `.claude/guidelines/04-patterns/4.3-ai-integration-patterns.toon`
- auth → `arch-adr-007` → `.claude/guidelines/02-architecture/2.8-adr-007-authentication.toon`

### Subagents

Specialized agents in `.claude/agents/` - load on-demand with @ when needed:

| Agent             | Purpose                                        | File                   |
| ----------------- | ---------------------------------------------- | ---------------------- |
| project-planner   | Strategic planning                             | `project-planner.md`   |
| code-orchestrator | Coordinate specialists                         | `code-orchestrator.md` |
| nextjs-dev        | Frontend development                           | `nextjs-dev.md`        |
| supabase-dev      | Backend development                            | `supabase-dev.md`      |
| ai-integrator     | AI services                                    | `ai-integrator.md`     |
| code-reviewer     | Quality review **(invoke after code changes)** | `code-reviewer.md`     |
| test-engineer     | Testing                                        | `test-engineer.md`     |
| security-audit    | Security review                                | `security-audit.md`    |

## Quick Reference

### Core Principles (proj-principles)

1. **Voice-first**: Primary interaction via voice input
2. **Zero learning curve**: Minimal UI, immediate productivity
3. **Human review mandatory**: AI assists, humans approve
4. **Unidirectional**: Send only, no supplier response management
5. **Reliability over features**: Do less, do it perfectly

### Tech Stack (proj-stack)

- **Frontend**: Next.js 16 (App Router), Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Groq Whisper (STT), Gemini 1.5 Flash (parsing)
- **Email**: Resend
- **Hosting**: Vercel
- **Requirements**: Node.js 20.9+, TypeScript 5+

### Key Architecture Decisions

- **ADR-001**: App Router over Pages Router (arch-adr-001)
- **ADR-002**: Supabase as unified backend (arch-adr-002)
- **ADR-003**: Server Components by default (arch-adr-003)
- **ADR-004**: Gemini for order parsing (arch-adr-004)
- **ADR-005**: Groq Whisper for STT (arch-adr-005)
- **ADR-006**: Email-first for MVP (arch-adr-006)
- **ADR-007**: Email/Password auth + Multi-tenant (arch-adr-007)

### Domain Entities (proj-entities + arch-adr-007)

- **Organization**: id, name, slug, createdBy
- **Membership**: id, userId, organizationId, role (admin/member)
- **Invitation**: id, organizationId, email, role, invitedBy, expiresAt
- **Supplier**: id, organizationId, name, email, phone, category, customKeywords
- **Order**: id, organizationId, createdBy, sentAt, status (draft/review/sent/archived)
- **OrderItem**: id, orderId, supplierId, product, quantity, unit, confidence

### Application Flow

```
Voice/Text → Groq Whisper → Gemini Parse → Classification → Human Review → Email Send
```

## Development Workflow

### For Any Task

1. Check relevant guidelines in `.claude/guidelines/` for standards
2. Use `project-planner` for complex planning
3. Use `code-orchestrator` to delegate to specialists
4. **Always invoke `code-reviewer` after code changes**
5. Run `test-engineer` before PRs
6. Run `security-audit` before production deploys

### Guideline ID Format

IDs follow pattern: `[category]-[guideline]-[section]-[item]`

Examples:

- `proj-principles-voice-first` → Voice-first principle
- `arch-adr-001` → App Router ADR
- `code-naming-files-components` → Component naming convention
- `pat-react-server-client` → Server vs Client pattern
- `qual-security-check-rls` → RLS security check

### Definition of Done (flow-dod)

Before completing any task, verify:

- [ ] Code follows naming conventions (code-naming)
- [ ] TypeScript strict, no errors (code-typescript)
- [ ] Tests written and passing (qual-testing)
- [ ] Security checks passed (qual-security)
- [ ] Code reviewed (code-reviewer agent)
- [ ] PR checklist complete (flow-pr)

## TOON Format

This project uses TOON for AI context files. Key syntax:

- `[N]` for array lengths
- `{field1,field2}:` for tabular data
- Quote strings with special characters

Refer to `TOON_REFERENCE.md` for complete specification.

## Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm build               # Production build
pnpm lint                # ESLint
pnpm format              # Prettier

# Testing
pnpm test                # Unit tests
pnpm test:coverage       # With coverage
pnpm test:e2e            # E2E tests

# Supabase
pnpm dlx supabase gen types typescript --project-id wdtjhxxqgwobalxizlic > src/types/database.ts
```

## Important Paths

- **Guidelines**: `.claude/guidelines/`
- **Agents**: `.claude/agents/`
- **App Router**: `src/app/`
- **Components**: `src/components/`
- **Supabase clients**: `src/lib/supabase/`
- **AI services**: `src/lib/ai/`
- **Types**: `src/types/`
- **Migrations**: `supabase/migrations/`
