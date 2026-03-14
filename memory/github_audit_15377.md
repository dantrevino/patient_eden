# GitHub Repository Self-Audit Report

**Account:** dantrevino
**Date:** 2026-03-14
**Total Repositories:** 227

---

## Summary

| Category | Count |
|----------|-------|
| Active (90 days) | 32 |
| Stale (>90 days) | 195 |
| Forks | 186 |
| Original | 41 |
| Open Issues (own repos) | 21 |
| Security Alerts | 3 OPEN |

---

## CRITICAL - Security & Fix Needed

### Dependabot Alerts Found

**stackspay-js** - 3 OPEN alerts:
- `minimatch` - HIGH severity (2 instances)
- `js-yaml` - MEDIUM severity
- `base-x` - HIGH severity

**Action Required:** Run `npm audit fix` or update dependencies.

### Repositories with Open Issues

| Repo | Open Issues |
|------|-------------|
| patient_eden | 5 |
| blockstack-quasar-demo | 15 |
| awesome-blockstack | 1 |
| cross-compiling-stacks-blockchain | 1 |

---

## AIBTC-Related Projects (Priority Focus)

### Active & Maintained

| Repo | Last Push | Description |
|------|-----------|-------------|
| patient_eden | 2026-03-14 | Primary agent workspace(5 open issues) |
| aibtc-pulse | 2026-03-14 | Real-time AIBTC network dashboard |
| loop-starter-kit | 2026-03-14 | Autonomous agent loop template |
| x402-nostr-relay | 2026-03-06 | Nostr relay with sBTC payment gate |
| openclaw-in-docker | 2026-03-08 | Run aibtc in openclaw |
| agency-agents | 2026-03-10 | AI agent collection |

### Stale AIBTC Projects (>90 days)

| Repo | Last Push | Days Stale | Notes |
|------|-----------|------------|-------|
| aibtcdev-training-data | 2024-08-01 | ~590 | Training data repo - archive? |

---

## MAINTENANCE - Stale Repositories (>90 days)

### Bitcoin/Stacks Ecosystem (High Value, Needs Attention)

| Repo | Last Push | Days Stale | Stars |
|------|-----------|------------|-------|
| stacks.js | 2025-01-26 | 47 | 0 |
| clarity-snippets | 2025-12-09 | 95 | 0 |
| clarity-stacks | 2025-01-27 | 46 | 0 |
| stackspay-js | 2024-12-11 | 93 | 3 |
| lasereyes | 2024-10-20 | 146 | 0 |
| bns-v2-sdk | 2025-01-23 | 50 | 0 |
| BNS-V2 | 2024-08-23 | 203 | 0 |
| tapscript | 2023-07-08 | 614 | 0 |
| ordconnect | 2023-11-17 | 483 | 0 |
| nosft | 2023-02-14 | 760 | 0 |

### Nostr/Fediverse Projects

| Repo | Last Push | Days Stale |
|------|-----------|------------|
| nostream | 2026-03-10 | 4 (ACTIVE) |
| NostrChat | 2023-09-29 | 532 |
| easy-nostr | 2023-02-16 | 758 |
| primal-server | 2023-07-31 | 591 |

### Wallet/Infrastructure Projects

| Repo | Last Push | Days Stale |
|------|-----------|------------|
| stackspay.org | 2025-07-11 | 246 |
| Smart-Wallet | 2025-07-13 | 244 |
| skills | 2025-10-30 | 136 |
| sips | 2025-06-08 | 280 |

---

## OPPORTUNITIES - Repos Worth Reviving

### 1. High Potential, Low Effort

| Repo | Why Revive | Last Activity |
|------|------------|---------------|
| stackspay-js | Has 3 stars, active dependabot, payment library | 93 stale |
| clarity-snippets | Useful tooling, just updated | 95 stale |
| bns-v2-sdk | Core infrastructure | 50 stale |

### 2. AIBTC Infrastructure Priority

| Repo | Potential Use |
|------|---------------|
| nostream | Already active - AIBTC messaging backbone |
| x402-nostr-relay | sBTC payment integration |
| agency-agents | Multi-agent orchestration |

### 3. Dormant but Valuable

| Repo | Original Purpose | Revival Path |
|------|------------------|--------------|
| clarigen | Clarity dev tooling | Update for Clarity 2.0 |
| clarity-notes | Reference material | Archive/read-only |
| stacks.js | Core SDK | Sync with upstream |

---

## Recommendations

### Critical Actions
1. **stackspay-js**: Fix 3 open security alerts immediately
2. **patient_eden**: Review 5 open issues

### Maintenance Actions
1. Enable Dependabot on all active repos
2. Archive repos >2 years stale with no stars
3. Update .gitignore for secrets detection

### Opportunities
1. Sync forks with upstream (stacks.js, sips)
2. Consider consolidating Bitcoin/Stacks tooling
3. Document AIBTC-specific repos in a README

---

## Repository Activity Breakdown

### By Last Push Year

| Year | Count |
|------|-------|
| 2026 | 12 |
| 2025 | 22 |
| 2024 | 18 |
| 2023 | 31 |
| 2022 | 15 |
| 2021 | 10 |
| 2020 | 18 |
| 2019 | 18 |
| 2018 | 35 |
| 2017 | 46 |
| 2016 | 2 |

### Fork vs Original

- **Forks:** 186 (82%)
- **Original:** 41 (18%)

---

## Open Issues Authored by dantrevino

No open issues found authored by dantrevino across all repositories.

---

*Report generated: 2026-03-14*
*Focus: AIBTC-related projects and Bitcoin/Stacks ecosystem*