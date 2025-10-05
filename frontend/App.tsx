import React, { useCallback, useEffect, useMemo, useState } from 'react';

import MessageInput from './components/MessageInput';
import MessageList from './components/MessageList';
import { createMessage, deleteMessage, fetchMessages } from './services/messageService';
import type { Message } from './types';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 50%, #ede9fe 100%)',
  padding: '3rem 1rem',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#1e293b',
};

const errorStyle: React.CSSProperties = {
  marginTop: '1rem',
  color: '#b91c1c',
  textAlign: 'center',
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages],
  );

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchMessages();
      setMessages(data);
    } catch (err) {
      console.error(err);
      setError('メッセージ一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) {
      setError('テキストを入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const message = await createMessage(inputValue.trim());
      setMessages((prev) => [...prev, message]);
      setInputValue('');
    } catch (err) {
      console.error(err);
      setError('メッセージの登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [inputValue]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      setDeletingId(id);
      setError(null);
      await deleteMessage(id);
      setMessages((prev) => prev.filter((message) => message.id !== id));
    } catch (err) {
      console.error(err);
      setError('メッセージの削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>メッセージ管理</h1>
          <p style={{ color: '#475569' }}>テキストを保存すると、下にある一覧へ時系列で追加されます。</p>
        </header>

        <MessageInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {isLoading ? (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#475569' }}>読み込み中です…</p>
        ) : (
          <MessageList messages={sortedMessages} onDelete={handleDelete} deletingId={deletingId} />
        )}

        {error && <p style={errorStyle}>{error}</p>}
      </div>
    </div>
  );
};

export default App;
