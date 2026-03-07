# 📏 Rules — WhatsApp AI Bot

## 1. Principes Fondamentaux

### 1.1 Zéro Coût

* ❌ Ne jamais utiliser l'API WhatsApp Business officielle (payante)
* ❌ Ne jamais utiliser de modèles IA avec quota payant par défaut
* ✅ Toujours privilégier les tiers gratuits (OpenRouter free models, HuggingFace)
* ✅ PostgreSQL via Neon, Supabase ou Railway (tiers gratuits)

### 1.2 Architecture

* ✅ Séparation stricte des responsabilités (modules indépendants)
* ✅ Un service = un fichier = une responsabilité
* ✅ Pas de logique métier dans les routes API
* ✅ Toujours passer par le repository pour accéder à la DB
* ❌ Ne jamais importer Prisma directement hors de `lib/prisma.ts`

---

## 2. Conventions de Code

### 2.1 TypeScript

* ✅ Types explicites sur toutes les fonctions (params + retour)
* ✅ Interfaces préférées aux `type` pour les objets métier
* ❌ Pas de `any` — utiliser `unknown` si nécessaire
* ✅ Async/await systématique (pas de `.then()` chaînés)

### 2.2 Nommage

```
Fichiers       → kebab-case       : whatsapp.service.ts
Classes        → PascalCase       : WhatsAppService
Fonctions      → camelCase        : sendMessage()
Variables      → camelCase        : userPhone
Constants      → UPPER_SNAKE_CASE : MAX_HISTORY_LENGTH
Types/Interfaces → PascalCase     : MessageRole
```

### 2.3 Structure des modules

```
/modules/<nom>/
  <nom>.service.ts        # Logique métier
  <nom>.repository.ts     # Accès DB (si applicable)
  <nom>.types.ts          # Types/interfaces (si volumineuse)
```

---

## 3. Gestion des Erreurs

* ✅ Toujours wrapper les appels externes (IA, WhatsApp) dans try/catch
* ✅ Logger toutes les erreurs avec contexte (numéro, action)
* ✅ Ne jamais laisser une erreur crasher le process principal
* ✅ Répondre à l'utilisateur en cas d'erreur IA ("Service momentanément indisponible")
* ❌ Ne pas exposer les détails techniques d'erreur à l'utilisateur WhatsApp

```typescript
// ✅ Correct
try {
  const response = await aiService.generateResponse(messages);
} catch (error) {
  logger.error('AI generation failed', { error, userId });
  await whatsappService.sendMessage(phone, ERROR_MESSAGE);
}

// ❌ Incorrect
const response = await aiService.generateResponse(messages); // pas de try/catch
```

---

## 4. Logs

* ✅ Logger chaque message entrant (phone masqué : `+33***1234`)
* ✅ Logger chaque appel IA (durée, modèle utilisé)
* ✅ Logger chaque message envoyé
* ✅ Logger les connexions/déconnexions WhatsApp
* ❌ Ne jamais logger le contenu complet des messages en production
* ✅ Format structuré : `[NIVEAU] [MODULE] message {contexte}`

```
[INFO]  [WhatsApp] Message reçu de +33***5678
[INFO]  [AI]       Génération réponse — modèle: mistral-7b, durée: 1.2s
[INFO]  [WhatsApp] Réponse envoyée à +33***5678
[ERROR] [AI]       Timeout OpenRouter API { userId: "cld_xxx" }
```

---

## 5. Base de Données

* ✅ Toujours utiliser les migrations Prisma (`prisma migrate dev`)
* ✅ Limiter l'historique envoyé à l'IA (max 10 messages)
* ✅ Indexer les colonnes fréquemment requêtées (phone, userId)
* ❌ Ne jamais faire de requêtes DB en boucle (utiliser `findMany` avec `include`)
* ✅ Transactions Prisma pour les opérations multi-tables

---

## 6. Sécurité

* ✅ Variables sensibles uniquement dans `.env.local` (jamais commitées)
* ✅ `.env.local` dans `.gitignore`
* ✅ Valider les numéros de téléphone entrants
* ✅ Ignorer les messages de bots (éviter les boucles)
* ✅ Ignorer ses propres messages (fromMe: true)
* ❌ Ne jamais exposer la clé API IA côté client

---

## 7. WhatsApp / Baileys

* ✅ Ignorer les messages de groupe (MVP — uniquement messages privés)
* ✅ Ignorer les messages vides ou non-texte (images, vidéos, etc.)
* ✅ Gérer la reconnexion automatique
* ✅ Sauvegarder les credentials dans `/auth_info_baileys/`
* ✅ Ajouter `auth_info_baileys/` au `.gitignore`
* ❌ Ne jamais envoyer de messages en masse (risque de ban)

---

## 8. IA

* ✅ Toujours inclure un prompt système métier
* ✅ Limiter les tokens de réponse (max_tokens: 500 pour le MVP)
* ✅ Timeout sur les appels IA (15 secondes max)
* ✅ Fallback si l'IA ne répond pas
* ✅ Historique limité aux 10 derniers messages

---

## 9. Git & Versioning

* ✅ Commits en français ou anglais, toujours descriptifs
* ✅ Format : `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
* ❌ Ne jamais committer : `.env.local`, `auth_info_baileys/`, `node_modules/`
* ✅ Une branche par phase : `phase/1-mvp`, `phase/2-dashboard`

---

## 10. Évolutivité

* ✅ Chaque service doit être remplaçable (ex: changer de provider IA sans toucher au reste)
* ✅ Utiliser des interfaces pour les contrats de service
* ✅ Documenter les TODO et futurs points d'extension avec `// TODO [Phase X]:`
* ✅ Mettre à jour `progress.md` à chaque nouvelle fonctionnalité

---

*Ces règles s'appliquent à toutes les phases du projet.*
