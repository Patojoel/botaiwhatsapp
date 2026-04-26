# Registre des Erreurs (Errors Log)

Ce fichier répertorie les erreurs rencontrées pendant le développement et leur résolution, afin de servir de base de connaissances pour la suite du projet.

---

### 1. Erreur de typage Next.js 16 : `Type '{ params: Promise<{ id: string; }>; }' is not assignable...`
- **Fichier :** `src/app/api/instance/[id]/prompt/route.ts`
- **Description :** Lors du build ou de l'accès à la route, Next.js levait une erreur de compatibilité de type TypeScript concernant l'objet `params` dans le gestionnaire de route (Route Handler).
- **Cause :** Depuis Next.js 15+, les paramètres de route dynamique (`params` et `searchParams`) sont devenus **asynchrones**. Ils ne sont plus passés sous forme d'objet simple, mais sous forme de `Promise`.
- **Solution appliquée :**
  - Changement de la signature de la fonction de route pour accepter une `Promise` :
    ```typescript
    export async function PATCH(
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    )
    ```
  - Résolution de la promesse avant d'utiliser l'ID :
    ```typescript
    const { id: instanceId } = await params;
    ```

### 2. Boucle de redirection infinie ou impossibilité d'accéder au Dashboard (`/dashboard`)
- **Fichier :** `src/auth.config.ts`
- **Description :** Même connecté avec des identifiants valides, l'application redirigeait l'utilisateur en boucle ou renvoyait vers la page de login (`/api/auth/signin`).
- **Cause :** Dans le middleware ou le callback `authorized` de NextAuth, la condition vérifiant l'accès aux routes protégées retournait `false` (refus d'accès) même lorsque l'utilisateur était authentifié (`isLoggedIn === true`).
  ```typescript
  // Ancienne version erronée :
  if (isLoggedIn) return false; 
  ```
- **Solution appliquée :**
  - Correction de la logique de retour du middleware :
  ```typescript
  if (isDashboardAction || isApiDocsAction) {
    if (isLoggedIn) return true; // <-- CORRECTION: Autorise l'accès si connecté
    return false; // Redirige vers le login si non connecté
  }
  ```

### 3. Erreur Prisma : `Property 'whatsAppSession' does not exist...`
- **Fichier :** `prisma/schema.prisma` et divers fichiers modules.
- **Description :** Le Prisma Client ne reconnaissait pas la propriété `whatsAppSession` ou `WhatsAppSession`.
- **Cause :** Conflit de convention de nommage Prisma pour les acronymes (`WA` ou `WhatsApp`). Prisma transforme `WhatsAppSession` en une propriété au format camelCase qui peut être ambiguë.
- **Solution appliquée :**
  - Renommage du modèle en `WhatsappSession` (minuscule sur le 'a') dans `schema.prisma`.
  - Accès via `prisma.whatsappSession` (tout en minuscules sauf le S interne si applicable, mais ici `whatsappSession` est la convention générée).
  - Lancement de `npx prisma db push && npx prisma generate`.

### 4. Accès au Dashboard bloqué (Amélioration)
- **Fichier :** `src/auth.config.ts` et `src/app/dashboard/page.tsx`.
- **Description :** Besoin de tester le dashboard sans passer par le flux de login complexe.
- **Solution appliquée :**
  - Création d'une page de login premium à `/login`.
  - Désactivation temporaire de la redirection middleware pour `/dashboard`.
  - Ajout d'un "Mode Invité" dans la page serveur du dashboard qui utilise le premier utilisateur trouvé en base de données si aucune session n'est active.

