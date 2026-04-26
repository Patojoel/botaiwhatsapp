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

### ✅ PHASE 2 — Dashboard Admin

**Objectif** : Interface de gestion

- [x] Page `/dashboard` avec liste des conversations
- [x] Visualisation des messages par utilisateur
- [x] Statistiques (nb messages, utilisateurs actifs)
- [x] Bouton reconnexion WhatsApp
- [x] Affichage QR Code intégré
- [x] Auth simple (credentials)

---

### ✅ PHASE 3 — Personnalisation IA

**Objectif** : IA adaptable par domaine

- [x] Gestion des prompts système via DB
- [x] Profils de bot (boutique, support, info)
- [x] Mémoire longue terme (résumé conversations)
- [x] Détection d'intention (achat, info, plainte)
- [x] Réponses avec boutons/listes WhatsApp

---

### ✅ PHASE 4 — Multi-Bot & Scalabilité

**Objectif** : Gérer plusieurs instances WhatsApp

- [x] Support multi-sessions Baileys
- [x] Queue de messages (Bull/BullMQ)
- [x] Retry automatique sur erreur IA
- [x] Rate limiting par utilisateur
- [x] Webhooks sortants configurables

---

### ✅ PHASE 5 — Production

**Objectif** : Déploiement robuste

- [x] Docker + docker-compose
- [x] CI/CD GitHub Actions
- [x] Monitoring (Sentry ou equivalent)
- [x] Backup automatique DB
- [x] Documentation API Swagger

---

### 🔲 PHASE 6 — SaaS Architecture & Auth

**Objectif** : Transformer le bot unique en plateforme multi-utilisateur

- [ ] Refonte du schéma DB pour le multi-tenant (Account, Member, Subscription, BotInstance)
- [ ] Intégration de NextAuth.js / Auth.js (Google, Email/Magic Link)
- [ ] Gestion des rôles et permissions (ADMIN, USER)
- [ ] Isolation stricte des données entre les utilisateurs (Multi-Tenancy)
- [ ] Middlewares de sécurité pour les accès Dashboard

---

### 🔲 PHASE 7 — Multi-Instance WhatsApp Pro

**Objectif** : Permettre à chaque utilisateur de connecter son propre bot

- [ ] Refactorisation de `WhatsAppService` pour gérer N sockets simultanés
- [ ] Système de stockage des sessions Baileys dynamique (DB ou Redis)
- [ ] Interface de scan QR Code unique par compte utilisateur
- [ ] API de monitoring du statut des instances (Starting, QR, Connected, Error)
- [ ] Gestion automatique de la reconnexion des instances déconnectées

---

### 🔲 PHASE 8 — Panel Utilisateur SaaS (User UI)

**Objectif** : Interface complète pour les clients du SaaS

- [ ] Dashboard client personnalisé (Stats propres, crédits consommés)
- [ ] Console de visualisation des conversations en temps réel
- [ ] Système de quotas et crédits messages par abonnement
- [ ] Configuration de la clé API IA personnelle (BYOK) ou partagée
- [ ] Gestion des paramètres de notification

---

### 🔲 PHASE 9 — Personnalisation Avancée & Live Chat

**Objectif** : Contrôle expert sur le comportement des bots

- [ ] Éditeur de Prompt Système visuel par instance
- [ ] Système de "Takeover" : Reprise manuelle d'une conversation par l'utilisateur
- [ ] Déclenchement de webhooks externes lors de détections d'intentions
- [ ] Export des rapports de performance et de satisfaction (NPS IA)
- [ ] Support multi-agents pour un même bot instance

---

### 🔲 PHASE 10 — Monétisation & Global Scaling

**Objectif** : Lancement commercial et montée en charge

- [ ] Intégration Stripe (Plans Basic, Pro, Enterprise)
- [ ] Infrastructure Docker Swarm / Kubernetes pour le scaling des sockets
- [ ] API Publique pour intégrations tierces (Zapier, Make.com)
- [ ] Internationalisation de l'interface (Multi-langue i18n)
- [ ] Monitoring SaaS global (Downtime, Latence IA, Erreurs socket)

---

## 📈 Suivi d'Avancement

| Phase | Statut     | Completion |
| ----- | ---------- | ---------- |
| 1     | ✅ Terminé | 100%       |
| 2     | ✅ Terminé | 100%       |
| 3     | ✅ Terminé | 100%       |
| 4     | ✅ Terminé | 100%       |
| 5     | ✅ Terminé | 100%       |
| 6     | ✅ Terminé | 100%       |
| 7     | ✅ Terminé | 100%       |
| 8     | 🔲 À faire | 0%         |
| 9     | 🔲 À faire | 0%         |
| 10    | 🔲 À faire | 0%         |

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

_Dernière mise à jour : Transformation SaaS lancée — $(date)_
