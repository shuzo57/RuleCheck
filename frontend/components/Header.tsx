
import React from 'react';
import { LogoutIcon } from './icons';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-700">
              規定チェックAI（仮）
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <LogoutIcon className="h-5 w-5 mr-2" />
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
