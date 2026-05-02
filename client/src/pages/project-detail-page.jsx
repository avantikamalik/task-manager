import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  LayoutGrid,
} from 'lucide-react';

import { api, apiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea, Select, FieldError } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';

import {
  cn,
  formatDate,
  isOverdue,
  PRIORITY_TONE,
  STATUS_LABEL,
} from '@/lib/utils';

import { useAuth } from '@/context/auth-context';

const STATUSES = ['todo', 'in_progress', 'done'];

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}`)).data,
    enabled: Number.isFinite(projectId),
  });

  const tasksQuery = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/tasks`)).data,
    enabled: Number.isFinite(projectId),
  });

  const [tab, setTab] = useState('board');
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [memberModal, setMemberModal] = useState(false);
  const [editProject, setEditProject] = useState(false);
  const [deleteProject, setDeleteProject] = useState(false);

  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return <PageLoader />;
  }

  if (projectQuery.isError) {
    return (
      <Card className="rounded-3xl card-premium">
        <CardContent className="p-10">
          <EmptyState
            icon={AlertTriangle}
            title="Could not load project"
            description={apiError(projectQuery.error)}
            action={
              <Button onClick={() => navigate('/projects')}>
                Back
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const project = projectQuery.data.project;
  const members = projectQuery.data.members || [];
  const tasks = tasksQuery.data.tasks || [];

  const isAdmin =
    project.myRole === 'admin' ||
    user?.globalRole === 'admin';

  return (
    <>
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </button>

      {/* Header */}
      <div className="rounded-3xl card-premium p-7 mb-6">
        <PageHeader
          title={project.name}
          description={
            project.description ||
            'No description provided.'
          }
          actions={
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditProject(true)
                    }
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() =>
                      setDeleteProject(true)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}

              <Button
                onClick={() =>
                  setTaskModal({
                    open: true,
                    task: null,
                  })
                }
              >
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={tab === 'board'}
          onClick={() => setTab('board')}
        >
          <LayoutGrid className="h-4 w-4" />
          Board ({tasks.length})
        </TabButton>

        <TabButton
          active={tab === 'members'}
          onClick={() => setTab('members')}
        >
          <Users className="h-4 w-4" />
          Members ({members.length})
        </TabButton>
      </div>

      {tab === 'board' ? (
        <TaskBoard
          tasks={tasks}
          members={members}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          projectId={projectId}
          onEdit={(task) =>
            setTaskModal({
              open: true,
              task,
            })
          }
        />
      ) : (
        <MembersList
          members={members}
          ownerId={project.ownerId}
          isAdmin={isAdmin}
          projectId={projectId}
          onAdd={() =>
            setMemberModal(true)
          }
        />
      )}

      <TaskFormModal
        open={taskModal.open}
        onClose={() =>
          setTaskModal({
            open: false,
            task: null,
          })
        }
        task={taskModal.task}
        members={members}
        projectId={projectId}
      />

      <AddMemberModal
        open={memberModal}
        onClose={() =>
          setMemberModal(false)
        }
        projectId={projectId}
        existingMemberIds={
          new Set(
            members.map((m) => m.id)
          )
        }
      />

      <EditProjectModal
        open={editProject}
        onClose={() =>
          setEditProject(false)
        }
        project={project}
      />

      <ConfirmDeleteProjectModal
        open={deleteProject}
        onClose={() =>
          setDeleteProject(false)
        }
        project={project}
      />
    </>
  );
}
function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-5 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 transition',
        active
          ? 'bg-primary text-white shadow-md'
          : 'bg-white hover:bg-accent text-muted-foreground'
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------- */
/* BOARD */
/* ---------------------------------------------------------- */

function TaskBoard({
  tasks,
  members,
  isAdmin,
  currentUserId,
  projectId,
  onEdit,
}) {
  const grouped = useMemo(() => {
    const g = {
      todo: [],
      in_progress: [],
      done: [],
    };

    for (const t of tasks) {
      g[t.status]?.push(t);
    }

    return g;
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <Card className="rounded-3xl card-premium">
        <CardContent className="p-10 text-center">
          <h3 className="text-lg font-semibold">
            No tasks yet
          </h3>
          <p className="text-muted-foreground mt-2">
            Create your first task.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid xl:grid-cols-3 gap-5">
      {STATUSES.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={grouped[status]}
          members={members}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          projectId={projectId}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function Column({
  status,
  tasks,
  members,
  isAdmin,
  currentUserId,
  projectId,
  onEdit,
}) {
  return (
    <div className="rounded-3xl bg-muted/40 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">
          {STATUS_LABEL[status]}
        </h3>

        <span className="h-8 min-w-8 px-3 rounded-full bg-white shadow-sm text-sm flex items-center justify-center">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            projectId={projectId}
            onEdit={() => onEdit(task)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isAdmin,
  currentUserId,
  projectId,
  onEdit,
}) {
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (status) =>
      (
        await api.patch(
          `/tasks/${task.id}`,
          { status }
        )
      ).data,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['project-tasks', projectId],
      });

      qc.invalidateQueries({
        queryKey: ['dashboard'],
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () =>
      api.delete(`/tasks/${task.id}`),

    onSuccess: () => {
      toast.success('Task deleted');

      qc.invalidateQueries({
        queryKey: ['project-tasks', projectId],
      });

      qc.invalidateQueries({
        queryKey: ['dashboard'],
      });
    },
  });

  const overdue = isOverdue(
    task.dueDate,
    task.status
  );

  const canDelete =
    isAdmin ||
    task.createdBy === currentUserId;

  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm hover:shadow-lg transition relative group">
      <div className="flex justify-between gap-3">
        <h4 className="font-semibold text-sm">
          {task.title}
        </h4>

        <div className="relative">
          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-6 w-36 bg-white border rounded-xl shadow-xl overflow-hidden z-30">
              <button
                onClick={onEdit}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
              >
                Edit
              </button>

              {canDelete && (
                <button
                  onClick={() =>
                    deleteTask.mutate()
                  }
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <Badge
          className={
            PRIORITY_TONE[task.priority]
          }
        >
          {task.priority}
        </Badge>

        {task.dueDate && (
          <Badge
            className={
              overdue
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-700'
            }
          >
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(task.dueDate)}
          </Badge>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t gap-2">
        <div className="text-xs text-muted-foreground">
          {task.assigneeName || 'Unassigned'}
        </div>

        <Select
          value={task.status}
          onChange={(e) =>
            updateStatus.mutate(
              e.target.value
            )
          }
          className="h-8 text-xs w-auto"
        >
          {STATUSES.map((s) => (
            <option
              key={s}
              value={s}
            >
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
function MembersList({
  members,
  ownerId,
  isAdmin,
  projectId,
  onAdd,
}) {
  const qc = useQueryClient();

  const removeMember = useMutation({
    mutationFn: async (userId) =>
      api.delete(
        `/projects/${projectId}/members/${userId}`
      ),

    onSuccess: () => {
      toast.success('Member removed');

      qc.invalidateQueries({
        queryKey: ['project', projectId],
      });
    },
  });

  return (
    <Card className="rounded-3xl card-premium">
      <CardContent className="p-0">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            Team Members
          </h3>

          {isAdmin && (
            <Button onClick={onAdd}>
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        <div className="divide-y">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.name} />

                <div>
                  <p className="font-medium">
                    {m.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {m.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {m.id === ownerId && (
                  <Badge>
                    Owner
                  </Badge>
                )}

                <Badge>
                  {m.role}
                </Badge>

                {isAdmin &&
                  m.id !== ownerId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-rose-600"
                      onClick={() =>
                        removeMember.mutate(
                          m.id
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------- */
/* MODALS */
/* ---------------------------------------------------------- */

function TaskFormModal({
  open,
  onClose,
  task,
  members,
  projectId,
}) {
  const qc = useQueryClient();
  const isEdit = !!task;

  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      assigneeId: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        assigneeId: values.assigneeId
          ? Number(values.assigneeId)
          : null,
      };

      if (isEdit) {
        return (
          await api.patch(
            `/tasks/${task.id}`,
            payload
          )
        ).data;
      }

      return (
        await api.post(
          `/projects/${projectId}/tasks`,
          payload
        )
      ).data;
    },

    onSuccess: () => {
      toast.success(
        isEdit
          ? 'Task updated'
          : 'Task created'
      );

      qc.invalidateQueries({
        queryKey: ['project-tasks', projectId],
      });

      onClose();
      reset();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? 'Edit Task'
          : 'Create Task'
      }
    >
      <form
        onSubmit={handleSubmit((v) =>
          mutation.mutate(v)
        )}
        className="space-y-4"
      >
        <div>
          <Label>Title</Label>
          <Input
            {...register('title')}
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            {...register(
              'description'
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select
              {...register('status')}
            >
              <option value="todo">
                To Do
              </option>
              <option value="in_progress">
                In Progress
              </option>
              <option value="done">
                Done
              </option>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <Select
              {...register(
                'priority'
              )}
            >
              <option value="low">
                Low
              </option>
              <option value="medium">
                Medium
              </option>
              <option value="high">
                High
              </option>
            </Select>
          </div>

          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              {...register(
                'dueDate'
              )}
            />
          </div>

          <div>
            <Label>Assign</Label>
            <Select
              {...register(
                'assigneeId'
              )}
            >
              <option value="">
                None
              </option>

              {members.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                >
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit">
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Save Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function AddMemberModal({
  open,
  onClose,
  projectId,
  existingMemberIds,
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');

  const { data } = useQuery({
    queryKey: ['users-search', q],
    queryFn: async () =>
      (
        await api.get('/users', {
          params: q ? { q } : {},
        })
      ).data,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (userId) =>
      (
        await api.post(
          `/projects/${projectId}/members`,
          {
            userId,
            role: 'member',
          }
        )
      ).data,

    onSuccess: () => {
      toast.success('Member added');

      qc.invalidateQueries({
        queryKey: ['project', projectId],
      });

      onClose();
    },
  });

  const users = (
    data?.users || []
  ).filter(
    (u) =>
      !existingMemberIds.has(u.id)
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Team Member"
    >
      <div className="space-y-4">
        <Input
          placeholder="Search user..."
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
        />

        <div className="max-h-72 overflow-y-auto border rounded-2xl divide-y">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={u.name}
                />

                <div>
                  <p className="font-medium">
                    {u.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {u.email}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  mutation.mutate(
                    u.id
                  )
                }
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function EditProjectModal({
  open,
  onClose,
  project,
}) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
  } = useForm({
    values: {
      name:
        project?.name || '',
      description:
        project?.description ||
        '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values) =>
      (
        await api.patch(
          `/projects/${project.id}`,
          values
        )
      ).data,

    onSuccess: () => {
      toast.success(
        'Project updated'
      );

      qc.invalidateQueries({
        queryKey: [
          'project',
          project.id,
        ],
      });

      qc.invalidateQueries({
        queryKey: [
          'projects',
        ],
      });

      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Project"
    >
      <form
        onSubmit={handleSubmit((v) =>
          mutation.mutate(v)
        )}
        className="space-y-4"
      >
        <div>
          <Label>Name</Label>
          <Input
            {...register('name')}
          />
        </div>

        <div>
          <Label>
            Description
          </Label>
          <Textarea
            {...register(
              'description'
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDeleteProjectModal({
  open,
  onClose,
  project,
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () =>
      api.delete(
        `/projects/${project.id}`
      ),

    onSuccess: () => {
      toast.success(
        'Project deleted'
      );

      qc.invalidateQueries({
        queryKey: ['projects'],
      });

      qc.invalidateQueries({
        queryKey: ['dashboard'],
      });

      navigate('/projects');
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Project?"
      description="This cannot be undone."
    >
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          variant="destructive"
          onClick={() =>
            mutation.mutate()
          }
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
export default ProjectDetailPage;