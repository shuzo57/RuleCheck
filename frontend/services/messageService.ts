import type { Message } from '../types';

const DEFAULT_API_BASE = 'http://localhost:8000';
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? DEFAULT_API_BASE;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'API request failed');
  }
  return response.json() as Promise<T>;
}

export async function fetchMessages(): Promise<Message[]> {
  const response = await fetch(`${API_BASE}/messages`);
  return handleResponse<Message[]>(response);
}

export async function createMessage(text: string): Promise<Message> {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return handleResponse<Message>(response);
}

export async function deleteMessage(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/messages/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to delete message');
  }
}
