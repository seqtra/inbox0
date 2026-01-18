import { FastifyInstance } from 'fastify';
import { google } from 'googleapis';

export default async function (fastify: FastifyInstance) {
  
  // Initialize the OAuth2 Client
  // We read these from the .env file
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback' 
);

  // 1. The "Login" Endpoint
  // The frontend links here. We redirect the browser to Google.
  fastify.get('/api/auth/google', async (request, reply) => {
    
    // Generate the URL that asks for permission to read emails
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request a refresh token so we can work while user is offline
      scope: scopes,
      include_granted_scopes: true,
    });

    // Redirect the user to Google
    return reply.redirect(authorizationUrl);
  });

  // 2. The "Callback" Endpoint
  // Google redirects back here with a ?code=...
  fastify.get('/api/auth/google/callback', async (request: any, reply) => {
    const { code } = request.query;

    if (!code) {
      return reply.status(400).send('No code provided');
    }

    try {
      // Exchange the temporary code for a permanent Access Token
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // TODO: Save 'tokens.refresh_token' to your Postgres database linked to this user.
      // For now, we will just log it to prove it works.
      console.log('✅ SUCCESSFULLY AUTHENTICATED!');
      console.log('Access Token:', tokens.access_token);
      console.log('Refresh Token:', tokens.refresh_token);

      // Redirect back to the frontend dashboard with a success flag
      return reply.redirect('http://localhost:4200?status=connected');
      
    } catch (error) {
      console.error('Error retrieving access token', error);
      return reply.status(500).send('Authentication failed');
    }
  });
}