import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Users
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="container h-16 flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
                <CheckSquare className="h-5 w-5" />
              </div>

              <div className="hidden sm:block">
                <p className="font-semibold leading-none">Team Task</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Professional Workspace
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold">{user?.name}</span>
              <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                {user?.globalRole === 'admin' && <Users className="h-3 w-3" />}
                {user?.globalRole}
              </span>
            </div>

            <Avatar name={user?.name} />

            <button
              onClick={handleLogout}
              className="h-10 w-10 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition"
            >
              <LogOut className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden border-t px-3 py-2 flex gap-2 overflow-x-auto scrollbar-thin">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-xl text-sm flex items-center gap-2 whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-white text-muted-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 container py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Team Task Manager · Crafted for productivity
      </footer>
    </div>
  );
}