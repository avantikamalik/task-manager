import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FolderKanban,
  Plus,
  Loader2,
  ArrowUpRight
} from 'lucide-react';

import { api, apiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Input,
  Label,
  Textarea,
  FieldError
} from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { formatDate } from '@/lib/utils';

export function ProjectsPage() {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });

  const projects = data?.projects || [];

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage all active projects and collaborate with your team."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : projects.length === 0 ? (
        <Card className="rounded-3xl card-premium">
          <CardContent className="p-0">
            <EmptyState
              icon={FolderKanban}
              title="No projects found"
              description="Create your first project and start organizing tasks."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ProjectCard({ project }) {
  const counts = project.taskCounts || {
    total: 0,
    done: 0,
    overdue: 0,
  };

  const completion = counts.total
    ? Math.round((counts.done / counts.total) * 100)
    : 0;

  return (
    <Link to={`/projects/${project.id}`} className="group">
      <Card className="rounded-3xl card-premium h-full hover:-translate-y-1">
        <CardContent className="p-6">

          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition">
                {project.name}
              </h3>

              <p className="text-sm text-muted-foreground mt-1">
                Updated {formatDate(project.updatedAt)}
              </p>
            </div>

            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[42px]">
            {project.description || 'No project description available.'}
          </p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="font-semibold">{completion}%</span>
            </div>

            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between mt-5 text-sm">
            <span className="text-emerald-600 font-medium">
              {counts.done} Done
            </span>

            <span className="text-rose-600 font-medium">
              {counts.overdue} Overdue
            </span>
          </div>

        </CardContent>
      </Card>
    </Link>
  );
}

function CreateProjectModal({ open, onClose }) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (values) =>
      (await api.post('/projects', values)).data,

    onSuccess: () => {
      toast.success('Project created');
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      reset();
      onClose();
    },

    onError: (err) =>
      toast.error(apiError(err, 'Could not create project')),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Project"
      description="Start a new workspace for your team."
    >
      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >

        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            placeholder="Website Redesign"
            {...register('name', {
              required: 'Name required'
            })}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your project..."
            {...register('description')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create Project
          </Button>
        </div>

      </form>
    </Modal>
  );
}