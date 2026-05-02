import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export const STATUS_LABEL = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const STATUS_TONE = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
};

export const PRIORITY_TONE = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-rose-100 text-rose-800',
};
