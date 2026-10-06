import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import type {
  RegisterDto,
  LoginDto,
  AuthTokens,
  User,
  Project,
  IssuesQueryParams,
  CreateIssueDto,
  UpdateIssueDto,
} from '@/types';

const API = '/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(typeof window !== 'undefined' && useAuthStore.getState().token
        ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
        : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginDto) => request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: ({ token, user }) => {
      login(user, token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/projects');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterDto) =>
      request<AuthTokens>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: ({ token, user }) => {
      login(user, token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/projects');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => request('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      logout();
      router.push('/login');
    },
  });
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => request<User>('/auth/me'),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function useProjects(params?: ProjectsQueryParams) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
  }
  return useQuery({
    queryKey: ['projects', qs.toString()],
    queryFn: () => request(`/projects${qs.toString() ? `?${qs}` : ''}`),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => request(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDto & { description?: string }) =>
      request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export function useIssues(params?: IssuesQueryParams) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => qs.append(k, String(item)));
      else if (v !== undefined) qs.set(k, String(v));
    });
  }
  return useQuery({
    queryKey: ['issues', qs.toString()],
    queryFn: () => request(`/issues${qs.toString() ? `?${qs}` : ''}`),
  });
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => request(`/issues/${id}`),
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueDto) =>
      request('/issues', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['issues', `projectId=${vars.projectId}`],
      });
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssueDto }) =>
      request(`/issues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['issue', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/issues/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

// ─── Sprints ──────────────────────────────────────────────────────────────────

export function useSprints(projectId?: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () =>
      request(`/sprints?projectId=${projectId}`, {
        ...(projectId ? {} : { queryKey: [] }),
      }),
    enabled: !!projectId,
  });
}
