# Microsoft Teams Integration Guide

You do not need to host the application first to start building the Teams integration. You can prepare the manifest and test locally, but to sideload or publish the app in Teams you will eventually need reachable HTTPS URLs for the frontend and backend.

## Recommended approach

Use a Teams tab app first. That reuses the existing React frontend and needs the least extra work.

If you later want in-Teams alerts or actions, add a bot after the tab app is working.

## What to prepare now

1. Final frontend URL, for example `https://your-app.vercel.app`.
2. Final backend URL, for example `https://your-backend.onrender.com`.
3. A Teams app manifest that points to the frontend.
4. Two icons: `color.png` and `outline.png`.

## Manifest template

Replace the placeholders before sideloading or publishing:

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.17/MicrosoftTeams.schema.json",
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "YOUR-TEAMS-APP-ID",
  "packageName": "com.yourcompany.internshipmanager",
  "developer": {
    "name": "Your Organization",
    "websiteUrl": "https://your-app.vercel.app",
    "privacyUrl": "https://your-app.vercel.app/privacy",
    "termsOfUseUrl": "https://your-app.vercel.app/terms"
  },
  "name": {
    "short": "Internship Manager",
    "full": "Internship Manager"
  },
  "description": {
    "short": "Manage internship workflows in Teams",
    "full": "A tab app for internship registration, reports, feedback, and supervision inside Microsoft Teams."
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "accentColor": "#0f172a",
  "staticTabs": [
    {
      "entityId": "home",
      "name": "Home",
      "contentUrl": "https://your-app.vercel.app",
      "websiteUrl": "https://your-app.vercel.app",
      "scopes": ["personal"]
    }
  ],
  "validDomains": [
    "your-app.vercel.app",
    "your-backend.onrender.com"
  ],
  "permissions": ["identity", "messageTeamMembers"]
}
```

## Local testing before hosting

You can still test the Teams shell locally by exposing your local frontend with a tunnel like Microsoft Dev Tunnels or ngrok, then pointing the manifest at that temporary HTTPS URL.

## Hosting order

1. Deploy the backend first.
2. Deploy the frontend with its production API URL.
3. Update the manifest with the final URLs.
4. Sideload the app in Teams Developer Portal.
5. If needed, add a bot or message extension later.

## Cost notes

- Teams app manifest work is free.
- Entra app registration is usually free.
- You may pay for hosting if free tier limits are exceeded.
- Azure charges apply only if you add Azure services such as a bot or Graph-heavy features.