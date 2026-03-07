# 📊 WhatsApp AI Bot — Progress & Architecture

## 🏗️ Architecture Complète

```
whatsapp-ai-bot/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   ├── webhook/
│   │   │   │   └── route.ts          # Webhook entrant (futur usage)
│   │   │   └── status/
│   │   │       └── route.ts          # Santé du bot & QR Code
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Interface admin (Phase 2)
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Page d'accueil / QR
│   ├── modules/
│   │   ├── whatsapp/
│   │   │   └── whatsapp.service.ts   # Connexion Baileys, send/receive
│   │   ├── ai/
│   │   │   └── ai.service.ts         # Appels OpenRouter / HuggingFace
│   │   └── conversation/
│   │       └── conversation.repository.ts  # CRUD messages & users
│   └── lib/
│       ├── prisma.ts                 # Client Prisma singleton
│       └── logger.ts                 # Logger structuré
├── prisma/
│   └── schema.prisma                 # Modèles DB
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.ts
├── rules.md
└── progress.md
```

---

## 🔄 Flow des Messages (MVP)

```
[Utilisateur WhatsApp]
        │
        ▼
[Baileys WebSocket]
        │
        ▼ messages-upsert event
[whatsapp.service.ts]
        │
        ├──► [conversation.repository] → saveMessage(role: "user")
        │
        ├──► [conversation.repository] → getHistory(userId)
        │
        ▼
[ai.service.ts]
        │  POST → OpenRouter API
        │  model: mistralai/mistral-7b-instruct:free
        │
        ▼
[Réponse IA]
        │
        ├──► [conversation.repository] → saveMessage(role: "assistant")
        │
        ▼
[Baileys sendMessage()]
        │
        ▼
[Utilisateur reçoit la réponse]
```

---

## 📦 Stack Technologique

| Composant       | Technologie                        | Gratuit |
| --------------- | ---------------------------------- | ------- |
| Framework       | Next.js 15 (App Router)            | ✅      |
| Langage         | TypeScript 5                       | ✅      |
| WhatsApp        | Baileys (@whiskeysockets/baileys)  | ✅      |
| IA              | OpenRouter (mistral-7b:free)       | ✅      |
| Base de données | PostgreSQL + Prisma ORM            | ✅      |
| Logs            | Console structurée (custom logger) | ✅      |

---

## 🗄️ Modèle de Données

```prisma
model User {
  id        String    @id @default(cuid())
  phone     String    @unique
  name      String?
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      Role
  content   String
  createdAt DateTime @default(now())
}

enum Role {
  user
  assistant
}
```

---

## 🚀 Phases du Projet

---

### ✅ PHASE 1 — MVP (ACTUELLE)

**Objectif** : Bot fonctionnel de bout en bout

- [x] Structure du projet Next.js + TypeScript
- [x] Schéma Prisma (User, Message)
- [x] `whatsapp.service.ts` — Connexion Baileys + QR Code
- [x] `ai.service.ts` — Appel OpenRouter gratuit
- [x] `conversation.repository.ts` — Persistance PostgreSQL
- [x] Logger structuré
- [x] Route API `/api/status` — Santé + QR
- [x] Page d'accueil avec affichage QR Code
- [x] Gestion d'erreurs globale
- [x] Variables d'environnement documentées
- [x] README complet

**Livrable** : Bot qui répond aux messages WhatsApp via IA

---

### 🔲 PHASE 2 — Dashboard Admin

**Objectif** : Interface de gestion

- [ ] Page `/dashboard` avec liste des conversations
- [ ] Visualisation des messages par utilisateur
- [ ] Statistiques (nb messages, utilisateurs actifs)
- [ ] Bouton reconnexion WhatsApp
- [ ] Affichage QR Code intégré
- [ ] Auth simple (credentials)

---

### 🔲 PHASE 3 — Personnalisation IA

**Objectif** : IA adaptable par domaine

- [ ] Gestion des prompts système via DB
- [ ] Profils de bot (boutique, support, info)
- [ ] Mémoire longue terme (résumé conversations)
- [ ] Détection d'intention (achat, info, plainte)
- [ ] Réponses avec boutons/listes WhatsApp

---

### 🔲 PHASE 4 — Multi-Bot & Scalabilité

**Objectif** : Gérer plusieurs instances WhatsApp

- [ ] Support multi-sessions Baileys
- [ ] Queue de messages (Bull/BullMQ)
- [ ] Retry automatique sur erreur IA
- [ ] Rate limiting par utilisateur
- [ ] Webhooks sortants configurables

---

### 🔲 PHASE 5 — Production

**Objectif** : Déploiement robuste

- [ ] Docker + docker-compose
- [ ] CI/CD GitHub Actions
- [ ] Monitoring (Sentry ou equivalent)
- [ ] Backup automatique DB
- [ ] Documentation API Swagger

---

## 📈 Suivi d'Avancement

| Phase | Statut     | Completion |
| ----- | ---------- | ---------- |
| 1     | ✅ Terminé | 100%       |
| 2     | ✅ Terminé | 100%       |
| 3     | ✅ Terminé | 100%       |
| 4     | ✅ Terminé | 100%       |
| 5     | ✅ Terminé | 100%       |

---

## 🔧 Commandes de Développement

```bash
# Installation
npm install

# Initialisation DB
npx prisma migrate dev --name init

# Lancement développement
npm run dev

# Génération client Prisma
npx prisma generate

# Studio Prisma (GUI DB)
npx prisma studio
```

---

_Dernière mise à jour : Phase 1 MVP — $(date)_
