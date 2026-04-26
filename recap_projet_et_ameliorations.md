# Recapitulatif Complet du Projet BotWhatsAppAI

## Présentation du Projet
BotWhatsAppAI est une plateforme SaaS (Software as a Service) développée en **Next.js (App Router)** permettant aux utilisateurs de gérer plusieurs instances de bots WhatsApp automatisés par l'Intelligence Artificielle.
Chaque utilisateur peut connecter son propre numéro WhatsApp (via un QR code généré par **Baileys**) et définir un prompt système personnalisé. L'IA prend ensuite le relai pour répondre automatiquement et intelligemment aux messages des clients sur WhatsApp.

## Stack Technique
- **Framework Frontend/Backend :** Next.js 16 (App Router)
- **Base de Données :** PostgreSQL avec **Prisma ORM**
- **Authentification :** NextAuth v5 avec `@auth/prisma-adapter`
- **WhatsApp Web API :** `@whiskeysockets/baileys` (pour la gestion des sockets WhatsApp, QR codes, et évènements de messages)
- **Styling :** Tailwind CSS
- **Cache/Files d'attente (optionnel/futur) :** Redis & BullMQ (présents dans `package.json`)
- **IA :** Service IA interne (probablement via OpenAI ou un autre LLM) qui utilise le `systemPrompt` et l'historique des conversations pour générer les réponses.

## Structure Fonctionnelle
1. **Utilisateurs (Owners) :** Gérés par NextAuth (avec rôle ADMIN ou USER).
2. **Instances de Bot (`BotInstance`) :** Représentent les différentes connexions WhatsApp d'un utilisateur. Chaque instance gère sa propre session (via Baileys) et son propre prompt d'IA.
3. **Contacts & Messages :** Le système enregistre chaque numéro qui contacte le bot et conserve l'historique des messages pour alimenter le contexte de l'IA.

---

## Problèmes Corrigés

1. **Erreurs HTTP 400 sur `/api/status` en boucle :**
   - **Symptôme :** Le terminal affichait en boucle des requêtes `GET /api/status 400`.
   - **Cause :** La page d'accueil (`src/app/page.tsx`) tentait d'interroger le statut du bot (`/api/status`) toutes les 5 secondes sans fournir d'`instanceId`. Or, l'API `/api/status/route.ts` exige un paramètre `instanceId` dans l'URL pour fonctionner (car le système est multi-tenant/multi-instances).
   - **Correction :** La page d'accueil a été refondue en une véritable page de présentation (Landing Page SaaS) statique avec un bouton redirigeant vers le `Dashboard`. Les appels asynchrones en boucle vers l'API sans paramètre ont été supprimés. La gestion des QR codes est désormais exclusivement réservée au Dashboard (`DashboardClient.tsx`) qui fournit correctement l'`instanceId` sélectionné.

---

## Améliorations Recommandées

### 1. Sécurité et Gestion des Sessions Baileys
- **Nettoyage des sessions orphelines :** Actuellement, les fichiers de session WhatsApp sont stockés dans le dossier `auth_sessions`. Si une instance est supprimée en base de données, il faut s'assurer que le dossier correspondant dans `auth_sessions` est également supprimé pour éviter l'accumulation de fichiers inutiles.
- **Stockage distant des sessions :** Pour un vrai SaaS déployé sur Vercel ou une plateforme Serverless, le système de fichiers local (`fs`) n'est pas persistant. Il est crucial de migrer le stockage de l'état d'authentification de Baileys (`useMultiFileAuthState`) vers une base de données (ex: via Prisma) ou un stockage objet type AWS S3 ou Redis.

### 2. Performance et Scalabilité
- **Webhooks au lieu du Polling :** Le Dashboard interroge l'état de l'instance toutes les 5 secondes via un `setInterval`. L'utilisation de WebSockets (ex: Socket.io) ou de Server-Sent Events (SSE) réduirait considérablement la charge du serveur et offrirait une expérience en temps réel plus fluide.
- **Gestion de la file d'attente (BullMQ / Redis) :** Le traitement des messages et les requêtes vers le service IA sont synchrones lors de la réception d'un message WhatsApp (`messages.upsert`). En cas de fort trafic, cela pourrait bloquer le processus Node.js. Il est fortement recommandé de déléguer le traitement des réponses IA à des *Workers* via BullMQ (déjà présent dans le package.json).

### 3. Interface Utilisateur (Dashboard)
- **Gestion des erreurs et Reconnexion :** Ajouter un indicateur clair et une option pour se déconnecter proprement d'une instance WhatsApp (logout explicite) plutôt que de simplement "Relancer l'instance".
- **Édition du Prompt :** Permettre à l'utilisateur de modifier le `systemPrompt` ("Tu es un assistant commercial...") directement depuis le Dashboard pour personnaliser le comportement du bot de chaque instance.
- **Pagination des Messages :** Le chargement de l'historique des conversations est actuellement limité ou statique (`take: 10` dans Prisma). L'ajout d'une pagination "Load More" (ou Infinite Scroll) pour les messages améliorera l'expérience utilisateur.

### 4. Expérience Développeur
- **Typage Strict (TypeScript) :** Dans `DashboardClient.tsx`, de nombreuses variables utilisent le type `any` (ex: `users: any`, `instances: any`). L'utilisation des types Prisma générés (`BotInstance`, `Contact`, `Message`) réduira les risques d'erreurs d'exécution et améliorera l'autocomplétion.
