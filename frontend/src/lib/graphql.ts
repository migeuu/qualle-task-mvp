import { getToken } from './auth';
import { env } from './env';
import type { GraphQLResponse } from '../types';

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(env.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    let message = `GraphQL request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody.errors?.[0]?.message) {
        message = errorBody.errors[0].message
      }
    } catch {
      // use default message
    }
    throw new Error(message)
  }

  let json: GraphQLResponse<T>
  try {
    json = await response.json()
  } catch {
    throw new Error('Invalid JSON response from server')
  }

  if (json.errors && json.errors.length > 0) {
    const firstError = json.errors[0];
    const message =
      firstError.extensions?.originalError?.message ?? firstError.message;
    throw new Error(message);
  }

  return json.data;
}
