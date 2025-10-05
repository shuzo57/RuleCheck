import React from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  marginBottom: '0.5rem',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #cbd5f5',
  fontSize: '1rem',
  resize: 'vertical',
};

const buttonStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '9999px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#93c5fd',
  cursor: 'not-allowed',
};

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSubmit, isSubmitting }) => (
  <form onSubmit={onSubmit} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.1)' }}>
    <label htmlFor="message" style={labelStyle}>メッセージを入力</label>
    <textarea
      id="message"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={textareaStyle}
      placeholder="ここにテキストを入力してください"
    />
    <button
      type="submit"
      style={value.trim() ? (isSubmitting ? disabledButtonStyle : buttonStyle) : disabledButtonStyle}
      disabled={isSubmitting || !value.trim()}
    >
      {isSubmitting ? '送信中…' : '追加する'}
    </button>
  </form>
);

export default MessageInput;
