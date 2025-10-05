import React from 'react';

import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  onDelete: (id: number) => void;
  deletingId: number | null;
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '1.5rem',
  borderRadius: '1rem',
  boxShadow: '0 10px 40px rgba(15, 23, 42, 0.1)',
  marginTop: '1.5rem',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const messageStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '0.75rem',
  padding: '1rem',
  backgroundColor: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
};

const deleteButtonStyle: React.CSSProperties = {
  border: 'none',
  backgroundColor: '#ef4444',
  color: '#fff',
  padding: '0.4rem 0.75rem',
  borderRadius: '9999px',
  cursor: 'pointer',
  fontWeight: 600,
};

const disabledDeleteButtonStyle: React.CSSProperties = {
  ...deleteButtonStyle,
  backgroundColor: '#fca5a5',
  cursor: 'not-allowed',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#64748b',
};

const MessageList: React.FC<MessageListProps> = ({ messages, onDelete, deletingId }) => (
  <section style={containerStyle}>
    <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>メッセージ一覧</h2>
    {messages.length === 0 ? (
      <p style={emptyStyle}>まだメッセージはありません。</p>
    ) : (
      <ul style={listStyle}>
        {messages.map((message) => {
          const createdAt = new Date(message.created_at).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const isDeleting = deletingId === message.id;

          return (
            <li key={message.id} style={messageStyle}>
              <div style={headerStyle}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>{createdAt}</span>
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  style={isDeleting ? disabledDeleteButtonStyle : deleteButtonStyle}
                  disabled={isDeleting}
                >
                  {isDeleting ? '削除中…' : '削除'}
                </button>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default MessageList;
