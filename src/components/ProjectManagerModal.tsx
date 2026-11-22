import { useEffect, useState } from 'react';
import { Download, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react';
import type { PortfolioData, ProjectItem } from '../types/portfolio';
import { readFileAsDataUrl } from '../utils/media';

interface ProjectManagerModalProps {
  open: boolean;
  projects: ProjectItem[];
  onClose: () => void;
  onSaveProjects: (projects: ProjectItem[]) => void;
  onExportJson: () => void;
  onImportJson: (jsonText: string) => void;
  onResetDefaults: () => void;
}

export function ProjectManagerModal({
  open,
  projects,
  onClose,
  onSaveProjects,
  onExportJson,
  onImportJson,
  onResetDefaults,
}: ProjectManagerModalProps) {
  const [drafts, setDrafts] = useState<ProjectItem[]>(projects);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (open) {
      setDrafts(projects);
      setError('');
      setSavedMessage('');
    }
  }, [open, projects]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const updateField = (index: number, field: keyof ProjectItem, value: string) => {
    setDrafts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleImageUpload = async (index: number, file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateField(index, 'coverImage', dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load image.');
    }
  };

  const handleAddProject = () => {
    const newProject: ProjectItem = {
      id: `project-${Date.now()}`,
      name: 'New Project',
      shortDescription: 'Describe your project concisely here.',
      coverImage: '',
      liveDemoUrl: '',
      githubUrl: '',
      demoVideoUrl: '',
      overview: '',
      problemStatement: '',
      purpose: '',
      keyFeatures: [],
      technologiesUsed: [],
      myContribution: '',
      screenshots: [],
      developmentProcess: '',
      challengesAndLearning: '',
    };
    setDrafts((prev) => [...prev, newProject]);
  };

  const handleDeleteProject = (index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = drafts
      .filter((p) => p.name.trim().length > 0)
      .map((p) => ({
        ...p,
        name: p.name.trim(),
        shortDescription: p.shortDescription.trim(),
        coverImage: p.coverImage.trim(),
        liveDemoUrl: p.liveDemoUrl.trim(),
        githubUrl: p.githubUrl.trim(),
        demoVideoUrl: p.demoVideoUrl.trim(),
      }));
    onSaveProjects(cleaned);
    setSavedMessage('All project links and fields saved.');
    setTimeout(() => {
      setSavedMessage('');
      onClose();
    }, 650);
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        try {
          const parsed = JSON.parse(reader.result) as Partial<PortfolioData>;
          if (!parsed.projects || !Array.isArray(parsed.projects)) {
            setError('Selected JSON file is missing a valid projects list.');
            return;
          }
          onImportJson(reader.result);
          onClose();
        } catch {
          setError('Invalid JSON file selected.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage project links and details"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 sm:p-6 flex items-start justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#191919] rounded-[4px] border border-white/10 overflow-hidden my-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Project Link Management
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Edit each project&apos;s name, screenshot, Live Demo, GitHub Repository, and Demo Video URL independently.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project manager"
            className="inline-flex items-center justify-center w-11 h-11 rounded-[3px] border border-white/15 text-zinc-300 hover:bg-white/10 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="p-6 space-y-6">
          {error && (
            <p role="alert" className="text-sm text-red-300 bg-red-950/60 border border-red-500/30 rounded-[3px] px-4 py-2.5">
              {error}
            </p>
          )}
          {savedMessage && (
            <p role="status" className="text-sm text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-[3px] px-4 py-2.5">
              {savedMessage}
            </p>
          )}

          <div className="space-y-6">
            {drafts.map((item, idx) => (
              <div
                key={item.id}
                className="p-5 rounded-[4px] border border-white/10 bg-[#141414] space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-base font-semibold text-white">
                    {String(idx + 1).padStart(2, '0')}. {item.name || 'Untitled Project'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(idx)}
                    aria-label={`Remove ${item.name}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-[3px] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateField(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Project Screenshot (URL or Upload)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://... or upload image"
                        value={item.coverImage.startsWith('data:') ? 'Uploaded screenshot' : item.coverImage}
                        onChange={(e) => updateField(idx, 'coverImage', e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-[3px] border border-white/15 bg-[#252525] hover:bg-[#303030] cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5 text-[#109E6B]" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleImageUpload(idx, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={item.liveDemoUrl}
                      onChange={(e) => updateField(idx, 'liveDemoUrl', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={item.githubUrl}
                      onChange={(e) => updateField(idx, 'githubUrl', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Demo Video URL (YouTube, Unlisted YouTube, or Direct MP4)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or https://.../demo.mp4"
                      value={item.demoVideoUrl}
                      onChange={(e) => updateField(idx, 'demoVideoUrl', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={item.shortDescription}
                      onChange={(e) => updateField(idx, 'shortDescription', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] text-white"
              >
                <Plus className="w-4 h-4 text-[#109E6B]" />
                <span>Add Project</span>
              </button>
              <button
                type="button"
                onClick={onExportJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] text-zinc-200"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] text-zinc-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept="application/json"
                  className="sr-only"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] text-zinc-400"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
