'use client';

import { useState, FormEvent } from 'react';
import { Project } from '@/types';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useCreateProject, useProjects } from '@/hooks/useApi';

export default function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', description: '' });

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createProject.mutateAsync({
      key: fd.get('key') as string,
      name: fd.get('name') as string,
      description: fd.get('description') as string || undefined,
    });
    setModalOpen(false);
    setForm({ key: '', name: '', description: '' });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary">Projects</h2>
        <Button onClick={() => setModalOpen(true)}>
          <span aria-hidden="true">+</span> New project
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" aria-hidden="true" />
        </div>
      )}

      {!isLoading && (!data?.data?.length) && (
        <div className="text-center py-20 text-neutral-500">
          <p className="text-lg">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      )}

      {!isLoading && data?.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((project: Project) => (
            <a
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="bg-surface-800 border border-neutral-800 rounded-xl p-6 hover:border-primary-500/30 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                <span className="text-primary-400 font-bold text-sm">{project.key}</span>
              </div>
              <h3 className="text-base font-semibold text-primary mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>{project.memberCount} members</span>
                <span>{project.openIssueCount} issues</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => document.querySelector('form')?.requestSubmit()}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Project key
            </label>
            <input
              id="key"
              name="key"
              type="text"
              required
              pattern="[A-Z0-9]{2,10}"
              placeholder="PROJ"
              className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 font-mono uppercase"
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase() }))}
            />
            <p className="text-xs text-neutral-500 mt-1">2-10 uppercase letters or digits</p>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={200}
              placeholder="Project Titan"
              className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={2000}
              placeholder="What is this project about?"
              className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 resize-vertical"
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {createProject.isError && (
            <p className="text-sm text-error-400">{createProject.error?.message ?? 'Failed to create project'}</p>
          )}
        </form>
      </Modal>
    </div>
  );
}
