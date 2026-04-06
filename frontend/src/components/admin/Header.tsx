'use client';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-6 py-4">
      {/* Search */}
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          placeholder="Search..."
          className="w-64 rounded-lg border border-[#E2E8F0] bg-[#F7F9FC] py-2 pl-9 pr-4 text-sm text-[#1C2434] placeholder-[#64748B] outline-none focus:border-[#3C50E0] transition-colors"
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-[#64748B] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#3C50E0]" />
        </button>

        {/* Divider */}
        <span className="h-8 w-px bg-[#E2E8F0]" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3C50E0] text-sm font-semibold text-white">
            {user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[#1C2434]">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-[#64748B]">{user?.role ?? 'Admin'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-[#64748B] hover:text-[#D34053]"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
