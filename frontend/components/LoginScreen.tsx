import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
          規定チェックAI（仮）
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          ログイン不要のテストモード
        </p>
        <button
          onClick={onLogin}
          className="w-full py-3 px-4 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-105"
        >
          開始する
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
