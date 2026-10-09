# Indunix AI (`indunixai.com`)

> **Frontier Sovereign AI API Gateway & Enterprise Infrastructure with Native Nigerian Naira (NGN) Settlements.**

[![Status](https://img.shields.io/badge/Gateway_API-Operational_99.9%25-emerald?style=flat-square)](https://api.indunixai.com/health)
[![Sovereign Parity](https://img.shields.io/badge/OpenAI_SDK-100%25_Drop--In-blue?style=flat-square)](https://docs.indunixai.com)
[![Settlements](https://img.shields.io/badge/Settlement_Currency-NGN_(Paystack)-success?style=flat-square)](https://indunixai.com)
[![Inference Engine](https://img.shields.io/badge/Model_Core-DeepSeek--V3_%26_R1-violet?style=flat-square)](https://indunixai.com/#models)

Indunix AI is an enterprise-grade artificial intelligence gateway purpose-built for African software developers, fintechs, and corporate organizations. It solves the foreign exchange constraint by providing drop-in OpenAI-compatible endpoints with direct payment settlements in Nigerian Naira (NGN) via Paystack.

---

## 🌟 Core Highlights

- ⚡ **100% OpenAI Drop-In Parity:** Point existing OpenAI SDK libraries to `base_url="https://api.indunixai.com/v1"` with zero code refactoring.
- 🇳🇬 **Direct Naira Settlements:** Top up prepaid balances using Naira debit cards (Mastercard, Visa, Verve), direct bank transfer, USSD, and OPay.
- 🧠 **Frontier Cognition:** Powered by DeepSeek-V3 and DeepSeek-R1, netting 75%–88% gross profit margins on token metering.
- 🏢 **Air-Gapped Enterprise Nodes:** Deploy dedicated on-premise inference engines inside bank data centers with 100% data sovereignty and zero cloud egress.
- 🛡️ **Zero Data Retention Charter:** Prompts and completions are processed ephemerally in active memory and never used for foundation model training.
- 🐳 **Coolify & Docker Ready:** Containerized multi-stage builds with Traefik reverse proxy and SSE real-time streaming optimizations.

---

## 🚀 Proprietary Model Lineup

| Model ID | Tagline | Context Window | Rate (NGN / 1M Tokens) | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **`indunix-1-spark`** | High-Concurrency Ops | 131,072 | **₦1,200.00** | Customer support, real-time chatbots, live voice agents |
| **`indunix-1-core`** | Enterprise Flagship | 65,536 | **₦1,800.00** | Executive memos, contract analysis, coding, enterprise SaaS |
| **`indunix-1-reason`** | Deep Thought (CoT) | 65,536 | **₦3,200.00** | Forensic balance sheet audits, investment underwriting, math |
| **`indunix-edge-local`** | On-Premise Air-Gapped | Dedicated Node | **Custom SLA** | Banking, defense, and strictly regulated enterprise clouds |

---

## 💻 Quickstart Integration

### Python (`openai` SDK)

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("INDUNIX_API_KEY"),
    base_url="https://api.indunixai.com/v1"
)

response = client.chat.completions.create(
    model="indunix-1-core",
    messages=[
        {"role": "system", "content": "You are Indunix AI Sovereign Intelligence."},
        {"role": "user", "content": "Analyze our quarterly corporate cash runway."}
    ],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

### TypeScript / Node.js

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.INDUNIX_API_KEY,
  baseURL: "https://api.indunixai.com/v1",
});

const completion = await client.chat.completions.create({
  model: "indunix-1-core",
  messages: [{ role: "user", content: "Summarize corporate balance sheet risks." }],
});

console.log(completion.choices[0].message.content);
```

### cURL

```bash
curl https://api.indunixai.com/v1/chat/completions \
  -H "Authorization: Bearer $INDUNIX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "indunix-1-core",
    "messages": [{"role": "user", "content": "Generate executive summary"}],
    "stream": true
  }'
```

---

## 🛠️ Tech Stack & Architecture

- **Backend Gateway:** FastAPI (Python 3.11+ async runtime), SQLAlchemy (AsyncPG / SQLite), Redis token bucket rate limiting.
- **Frontend & Docs:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons.
- **Payment Processing:** Paystack 256-bit encrypted merchant integration.
- **Containerization:** Docker Compose, Nginx (with `proxy_buffering off` for SSE streams), PostgreSQL 16, Redis 7.
- **Orchestration:** Coolify Panel on VPS with Traefik SSL/TLS automation.

---

## 📦 Deployment via Coolify

1. Connect this repository to your **Coolify** instance on your VPS.
2. Ensure the following domains point to your VPS IP:
   - `indunixai.com` & `www.indunixai.com` (Frontend web app)
   - `docs.indunixai.com` (Documentation portal)
   - `console.indunixai.com` (Developer Console)
   - `api.indunixai.com` (Gateway endpoint)
3. Populate environment variables from `.env.example`.
4. Click **Deploy**.

---

## 📄 License & Commercial Governance

Commercial administration, card gateway integration, and merchant settlements are processed under license by **Esam Creative Technologies**.

© 2026 Indunix AI Infrastructure. All rights reserved.
