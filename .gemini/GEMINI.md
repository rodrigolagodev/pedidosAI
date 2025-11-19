# GEMINI.md

This file provides guidance to Gemini 3 Pro and Antigravity agents when working with code in this repository.

## Project Overview

Pedidos is a web application that automates order management and delivery to suppliers in restaurants. Users (kitchen chefs, purchase managers) dictate or type orders via voice/text, which are processed by AI to classify items by supplier and send formatted messages automatically.

**Target users**: Spanish-speaking (Latin America) gastronomic businesses
**Current phase**: Definition and planning (pre-development)

## Documentation System

### Primary References

- [PROJECT_CONTEXT.toon](file:///home/rod/Proyects/pedidosAI/docs/PROJECT_CONTEXT.toon) - Main project context and domain knowledge
- [TOON_REFERENCE.md](file:///home/rod/Proyects/pedidosAI/docs/TOON_REFERENCE.md) - TOON format specification for .toon files

### Guidelines (Source of Truth)

- [.gemini/guidelines/INDEX.toon](file:///home/rod/Proyects/pedidosAI/.gemini/guidelines/INDEX.toon) - **Load this first** to find relevant guidelines

The INDEX contains all guidelines organized by category. Load specific guidelines on-demand using the paths from the index.

**How to use:**

1. Consult `INDEX.toon` to find the guideline ID or topic you need.
2. Load only that specific guideline: `.gemini/guidelines/[category]/[file].toon`
3. Use guideline IDs for cross-referencing.

## Workflows

We use Antigravity workflows for repeatable tasks. Found in `.agent/workflows/`.

- **Code Review**: `.agent/workflows/code_review.md` - Run after code changes.
- **Security Audit**: `.agent/workflows/security_audit.md` - Run before production deploys.

## Quick Reference

### Core Principles
1. **Voice-first**: Primary interaction via voice input
2. **Zero learning curve**: Minimal UI, immediate productivity
3. **Human review mandatory**: AI assists, humans approve
4. **Unidirectional**: Send only, no supplier response management
5. **Reliability over features**: Do less, do it perfectly

### Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Groq Whisper (STT), Gemini 1.5 Flash (parsing)
- **Email**: Resend

## Development Workflow

1. **Plan**: Use `task.md` and `implementation_plan.md` for every non-trivial task.
2. **Code**: Follow guidelines in `.gemini/guidelines`.
3. **Verify**: Run tests and use the `code_review` workflow.

## Important Paths

- **Guidelines**: `.gemini/guidelines/`
- **Personas**: `.gemini/personas/` (Legacy prompts)
- **Workflows**: `.agent/workflows/`
- **App Router**: `src/app/`
- **Supabase**: `supabase/`
