import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_WS_URL: z.string().url(),
});

const result = z.safeParse(envSchema, import.meta.env);

if (!result.success) {
  throw new Error(
    `Invalid environment variables:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
  );
}

export const env = {
  apiUrl: result.data.VITE_API_URL,
  wsUrl: result.data.VITE_WS_URL,
};
