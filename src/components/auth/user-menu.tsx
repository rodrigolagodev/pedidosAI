'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from '@/lib/auth/actions';

interface UserMenuProps {
  email: string;
  fullName?: string | null;
}

export function UserMenu({ email, fullName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0] ?? '')
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (email[0] ?? 'U').toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {initials}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="text-sm font-medium text-gray-900">
                {fullName || 'Usuario'}
              </p>
              <p className="truncate text-xs text-gray-500">{email}</p>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
