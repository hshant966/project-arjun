# Xiaomi MiMo Claw Trial — Detailed Research Report
**Date:** 2026-04-23  
**Compiled from:** MiMo official site, Decrypt, Reddit, OpenClaw docs, multiple sources

---

## 1. What is MiMo Claw?

MiMo Claw is Xiaomi's **one-click OpenClaw integration** that spins up a preconfigured cloud instance of OpenClaw powered by MiMo-V2-Pro. It's essentially a free trial gateway to experience Xiaomi's flagship AI agent framework.

- **Parent platform:** platform.xiaomimimo.com
- **Try page:** "Try MiMo Claw for Free" (HOT tag on MiMo docs)
- **Purpose:** Let users experience MiMo-V2-Pro + OpenClaw without self-hosting

---

## 2. The Trial — How It Works

### Duration
- **1-hour session** (confirmed by user experience)
- Time-limited, not token-limited within the session

### What You Get
- Full access to **MiMo-V2-Pro** model (1T total params, 42B active, 1M context)
- Pre-configured **OpenClaw instance** with Telegram integration
- Full agent capabilities: web browsing, code execution, file operations
- Access to skills and tools

### What Happens After the Trial Ends
- ⚠️ **Everything gets erased** (confirmed by user)
  - Workspace files deleted
  - Config wiped
  - Memory files gone
  - Bot goes offline
  - API access revoked
- The session is **fully ephemeral** — no data persists

### Limits During Trial
- Time-gated (1 hour), not quota-gated
- Model concurrency limits apply (RPM/TPM)
- 429 errors possible under high server load

---

## 3. MiMo-V2-Pro Model Specs

| Spec | Value |
|------|-------|
| Total Parameters | 1 Trillion+ |
| Active Parameters | 42B (MoE) |
| Context Window | 1M tokens |
| Architecture | Mixture of Experts |
| Attention | Hybrid (7:1 ratio) |
| Speed Layer | Multi-Token Prediction (MTP) |

### Benchmarks (Global Rankings)
| Benchmark | Score | Rank |
|-----------|-------|------|
| PinchBench (avg) | 81.0 | #3 globally |
| ClawEval | 61.5 | #3 globally |
| SWE-bench Verified | 78% | Top tier |
| Artificial Analysis Index | — | #8 worldwide, #2 Chinese |

### Competitive Position
- **Beats Claude Sonnet 4.6** on coding tasks
- **Approaches Claude Opus 4.6** on agent tasks
- Originally mistaken for "DeepSeek V4" (codename: Hunter Alpha)
- Costs a **fraction** of Claude pricing

---

## 4. Pricing — After Trial

### API Pricing (Pay-as-you-go)
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| MiMo-V2-Pro | $1.00 | $3.00 |
| MiMo-V2-Flash | $0.10 | — |

### Token Plan (Subscription)
- **4-tier gradient package** structure
- Monthly & annual subscriptions available
- **20% off** off-peak calls
- **30% savings** with monthly auto-renewal
- **Full reset** of used credits each period
- One-time purchase unlocks both **Pro** and **Omni** models
- **TTS model free** across all tiers (limited time)
- First-purchase discount available (one per account)

### Latest: MiMo-V2.5 Series (Newer)
- **MiMo-V2.5-Pro** — Flagship, peak intelligence
- **MiMo-V2.5** — Omni-modal agent (images, video, audio, text)
- **MiMo-V2.5-TTS-Series** — Voice synthesis, voice cloning
- Token Plan now supports V2.5 models

---

## 5. The Ecosystem — Competitors

MiMo Claw exists in a growing market of "Claw" integrations:

| Product | Company |
|---------|---------|
| **MiMo Claw** | Xiaomi |
| **MaxClaw** | MiniMax |
| **AutoClaw** | Ziphu AI |
| **Hermes Agent** | Nous Research |

Each offers a one-click OpenClaw deployment with their respective models.

---

## 6. Key Risks & Considerations

### Trial Limitations
- **1 hour is short** — complex tasks may not complete
- **No persistence** — everything vanishes when session ends
- **No export** — no built-in way to save workspace/data

### After Trial
- Need to subscribe to Token Plan to continue
- API costs can add up for heavy agentic use
- Concurrency limits even on paid plans

### Data Loss Warning
- All workspace files, configs, memory, and chat history are **permanently deleted** after trial
- No recovery option
- Must reconfigure everything from scratch if subscribing later

---

## 7. Recommendations

1. **Before trial ends:** Export/backup any important files, configs, or conversation logs
2. **For continued use:** Subscribe to Token Plan — best value for agentic workloads
3. **Cost optimization:** Use off-peak hours (20% discount) and auto-renewal (30% savings)
4. **Alternative:** Self-host OpenClaw with MiMo API key for full control over data persistence

---

## Sources
- mimo.xiaomi.com/mimo-v2-pro
- platform.xiaomimimo.com/docs/tokenplan/subscription
- platform.xiaomimimo.com/docs/pricing
- mimo.mi.com (MiMo V2.5 homepage)
- decrypt.co/362633 (MiMo V2 Pro review)
- decrypt.co/364621 (Claude Opus 4.7 comparison)
- reddit.com/r/artificial (pricing discussion)
- jitendrazaa.com (OpenClaw guide)
- Wikipedia: Xiaomi MiMo
