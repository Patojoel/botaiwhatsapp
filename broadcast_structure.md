# Système de Broadcast (Diffusion de messages)

Ce module permet d'envoyer des messages (texte, image, vidéo) à une liste de contacts de manière programmée ou instantanée.

## 🛠 Architecture Technique

### 1. Modèles de Données (Prisma)
- **BroadcastCampaign** : Contient la configuration de la diffusion (message, média, planning cron, instance bot).
- **BroadcastRecipient** : Liste des contacts ciblés par une campagne spécifique.
- **BroadcastLog** : Historique des envois pour chaque contact (Statut : Envoyé, Échec).

### 2. Fonctionnalités CRUD (Page Dédiée)
Contrairement aux statuts, la gestion se fera sur une page complète :
- `GET /dashboard/broadcasts` : Liste des diffusions.
- `GET /dashboard/broadcasts/new` : Formulaire de création.
- `GET /dashboard/broadcasts/[id]` : Modification.
- **Modal Générique** : Utilisée pour confirmer la suppression.

### 3. Moteur d'envoi (BullMQ)
- Utilisation de la file d'attente existante pour traiter les envois en arrière-plan.
- Gestion de délais entre les messages pour éviter le bannissement WhatsApp (Anti-spam).

## 🚀 Workflow d'Utilisation
1. L'utilisateur crée une campagne de diffusion.
2. Il sélectionne les contacts ou les groupes.
3. Il définit l'heure de passage (Cron).
4. Le worker BullMQ récupère la campagne et envoie les messages un par un.
5. L'utilisateur suit l'avancement sur la page de la campagne.

## 🎨 Design
- Utilisation de cartes premium.
- Barre de progression pour les envois en cours.
- Aperçu du message en temps réel.
