import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const client = createClient({
  auth: {
    url: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
    adapter: BetterAuthReactAdapter(),
  },
  dataApi: {
    url: process.env.NEXT_PUBLIC_NEON_DATA_API_URL,
  },
});
