import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  TrendingUp
} from 'lucide-react';

import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoader } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-context';

export function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });

  if (isLoading) return <PageLoader />;

  const counts = data?.counts || {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
  };

  const completion = counts.total
    ? Math.round((counts.done / counts.total) * 100)
    : 0;

  const stats = [
    {
      title: 'Projects',
      value: data?.projectCount ?? 0,
      icon: FolderKanban,
      color: 'from-indigo-500 to-violet-500'
    },
    {
      title: 'Open Tasks',
      value: counts.todo + counts.inProgress,
      icon: ListTodo,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Completed',
      value: counts.done,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-green-500'
    },
    {
      title: 'Overdue',
      value: counts.overdue,
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-500'
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
        description="Track performance, monitor tasks, and manage projects efficiently."
      />

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {stats.map((item) => (
          <Card key={item.title} className="card-premium rounded-3xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <h3 className="text-3xl font-bold mt-1">{item.value}</h3>
              </div>

              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg`}>
                <item.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Card */}
      <Card className="card-premium rounded-3xl mb-6">
        <CardContent className="p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Team Progress
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                {counts.done} of {counts.total} tasks completed
              </p>
            </div>

            <div className="text-4xl font-bold text-gradient">
              {completion}%
            </div>
          </div>

          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-5">

        <MiniCard
          title="To Do"
          value={counts.todo}
          color="text-slate-600"
        />

        <MiniCard
          title="In Progress"
          value={counts.inProgress}
          color="text-amber-600"
        />

        <MiniCard
          title="Done"
          value={counts.done}
          color="text-emerald-600"
        />

      </div>
    </>
  );
}

function MiniCard({ title, value, color }) {
  return (
    <Card className="card-premium rounded-3xl">
      <CardContent className="p-6 text-center">
        <p className="text-sm text-muted-foreground">{title}</p>
        <h3 className={`text-4xl font-bold mt-2 ${color}`}>
          {value}
        </h3>
      </CardContent>
    </Card>
  );
}