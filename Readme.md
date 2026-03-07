# 🤖 WhatsApp AI Bot

Bot WhatsApp propulsé par l'IA — Répond automatiquement aux messages de vos clients via un assistant commercial intelligent.

> **100% gratuit** · Next.js 15 · TypeScript · Baileys · OpenRouter · PostgreSQL

---

## ✨ Fonctionnalités (MVP)

* 📱 Connexion WhatsApp via **QR Code** (sans API officielle)
* 🤖 Réponses intelligentes via **Mistral 7B** (gratuit sur OpenRouter)
* 💾 Historique des conversations dans **PostgreSQL**
* 🔄 Contexte conservé entre les messages
* 🔁 Reconnexion automatique
* 🖥️ Page web pour scanner le QR Code

---

## 🏗️ Architecture

```
WhatsApp Message → Baileys → whatsapp.service → conversation.repository (save)
                                              → ai.service (generate)
                                              → conversation.repository (save)
                                              → WhatsApp reply
```

---

## 🚀 Installation & Lancement

### Prérequis

* Node.js 18+
* Un compte [OpenRouter](https://openrouter.ai/) (gratuit)
* Une base PostgreSQL ([Neon](https://neon.tech/) recommandé, gratuit)

### 1. Cloner & installer

```bash
git clone <votre-repo>
cd whatsapp-ai-bot
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` :

```env
DATABASE_URL="postgresql://..."   # Votre URL PostgreSQL
OPENROUTER_API_KEY="sk-or-v1-..."  # Votre clé OpenRouter
```

#### Obtenir une DB PostgreSQL gratuite (Neon)

1. Allez sur [neon.tech](https://neon.tech/)
2. Créez un projet
3. Copiez la connection string dans `DATABASE_URL`

#### Obtenir une clé OpenRouter gratuite

1. Allez sur [openrouter.ai](https://openrouter.ai/)
2. Créez un compte
3. API Keys → Create Key
4. Le modèle `mistralai/mistral-7b-instruct:free` est utilisé par défaut

### 3. Initialiser la base de données

```bash
npm run db:migrate
# Répondez "init" quand Prisma demande un nom de migration
```

### 4. Lancer le projet

```bash
npm run dev
```

### 5. Scanner le QR Code

Ouvrez [http://localhost:3000](http://localhost:3000/) et scannez le QR Code avec WhatsApp :

* Téléphone → WhatsApp → Menu ⋮ → **Appareils liés** → Scanner

✅ Une fois connecté, votre bot est actif et répondra automatiquement !

---

## 📁 Structure du projet

```
src/
├── app/
│   ├── api/
│   │   ├── status/route.ts          # Statut connexion + QR Code
│   │   └── webhook/route.ts         # Webhooks entrants (futur)
│   ├── page.tsx                     # Interface QR Code
│   └── layout.tsx
├── modules/
│   ├── whatsapp/
│   │   └── whatsapp.service.ts      # Connexion Baileys
│   ├── ai/
│   │   └── ai.service.ts            # Appels OpenRouter
│   └── conversation/
│       └── conversation.repository.ts  # DB CRUD
├── lib/
│   ├── prisma.ts                    # Client DB singleton
│   └── logger.ts                    # Logger structuré
└── instrumentation.ts               # Démarrage automatique du bot
```

---

## 🗄️ Base de données

```
User: id, phone, name, createdAt
Message: id, userId, role (user|assistant), content, createdAt
```

### Commandes Prisma

```bash
npm run db:migrate    # Appliquer les migrations
npm run db:studio     # GUI pour explorer la DB
npm run db:generate   # Régénérer le client Prisma
npm run db:reset      # Réinitialiser la DB (⚠️ efface tout)
```

---

## ⚙️ Personnalisation

### Modifier le prompt système

Éditez `src/modules/ai/ai.service.ts` :

```typescript
const SYSTEM_PROMPT = `Tu es un assistant pour...`
```

### Changer de modèle IA

Éditez `DEFAULT_MODEL` dans `ai.service.ts` :

```typescript
// Modèles gratuits disponibles sur OpenRouter :
const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free";
// const DEFAULT_MODEL = "google/gemma-7b-it:free";
// const DEFAULT_MODEL = "meta-llama/llama-3-8b-instruct:free";
```

### Limiter l'historique

Éditez `MAX_HISTORY_LENGTH` dans `conversation.repository.ts` (défaut : 10).

---

## 🚦 Endpoints API

| Méthode | Route            | Description               |
| -------- | ---------------- | ------------------------- |
| GET      | `/api/status`  | Statut bot + QR Code      |
| POST     | `/api/webhook` | Webhooks entrants (futur) |

---

## 🔒 Sécurité

* Les credentials WhatsApp sont sauvegardés dans `auth_info_baileys/` (ignoré par git)
* Ne jamais committer `.env.local`
* Les numéros de téléphone sont masqués dans les logs

---

## 📈 Roadmap

Voir [progress.md](https://claude.ai/chat/progress.md) pour les phases détaillées.

* **Phase 2** : Dashboard admin avec historique des conversations
* **Phase 3** : Prompts personnalisables, mémoire longue terme
* **Phase 4** : Multi-sessions WhatsApp, queues de messages
* **Phase 5** : Docker, monitoring, déploiement production

---

## 🐛 Dépannage

**Le QR Code ne s'affiche pas**
→ Vérifiez que le serveur est lancé (`npm run dev`) et consultez les logs terminal

**Erreur de connexion DB**
→ Vérifiez `DATABASE_URL` dans `.env.local` et que la DB est accessible

**L'IA ne répond pas**
→ Vérifiez `OPENROUTER_API_KEY` et votre quota sur openrouter.ai

**WhatsApp déconnecté fréquemment**
→ Normal — le bot se reconnecte automatiquement. Si le problème persiste, supprimez `auth_info_baileys/` et rescannez le QR.

---

*Voir [rules.md](https://claude.ai/chat/rules.md) pour les conventions et règles du projet.*
