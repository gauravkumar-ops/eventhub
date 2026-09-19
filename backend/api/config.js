// Vercel Serverless Function — api/config.js
// Serves Firebase configuration populated from Vercel Environment Variables

export default function handler(req, res) {
  // Enable CORS if accessed from preview URLs
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const apiKey =
    process.env.FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    '';

  const authDomain =
    process.env.FIREBASE_AUTH_DOMAIN || 'event-hub-36864.firebaseapp.com';
  const projectId =
    process.env.FIREBASE_PROJECT_ID || 'event-hub-36864';
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || 'event-hub-36864.firebasestorage.app';
  const messagingSenderId =
    process.env.FIREBASE_MESSAGING_SENDER_ID || '260968384601';
  const appId =
    process.env.FIREBASE_APP_ID || '1:260968384601:web:3d825f81f8f3d6351ec948';

  res.status(200).json({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  });
}
