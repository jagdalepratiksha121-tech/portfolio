import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ProjectItem } from '../types/portfolio';
import {
  getSafeExternalUrl,
  getSafeMediaUrl,
  parseDemoVideo,
  readFileAsDataUrl,
} from '../utils/media';
import { VideoPlayer } from './VideoPlayer';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  initialTab?: 'overview' | 'video' | 'edit';
  onClose: () => void;
  onSaveProject: (updated: ProjectItem) => void;
}

export function ProjectDetailModal({
  project,
  initialTab = 'overview',
  onClose,
  onSaveProject,
}: ProjectDetailModalProps) {
  const [isEditing, setIsEditing] = useState(initialTab === 'edit');
  const [draft, setDraft] = useState<ProjectItem | null>(project);
  const [featureInput, setFeatureInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [screenshotInput, setScreenshotInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    setDraft(project);
    setIsEditing(initialTab === 'edit');
    setUploadError('');
    setSaveNotice('');
  }, [project, initialTab]);

  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [project, onClose]);

  useEffect(() => {
    if (project && initialTab === 'video') {
      const el = document.getElementById('project-demo-video-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [project, initialTab]);

  if (!project || !draft) return null;

  const liveUrl = getSafeExternalUrl(project.liveDemoUrl);
  const githubUrl = getSafeExternalUrl(project.githubUrl);
  const parsedVideo = parseDemoVideo(project.demoVideoUrl);
  const coverUrl = getSafeMediaUrl(project.coverImage);

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDraft((prev) => (prev ? { ...prev, coverImage: dataUrl } : prev));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to load image.');
    }
  };

  const handleScreenshotUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDraft((prev) =>
        prev ? { ...prev, screenshots: [...prev.screenshots, dataUrl] } : prev,
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to load screenshot.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const cleaned: ProjectItem = {
      ...draft,
      name: draft.name.trim(),
      shortDescription: draft.shortDescription.trim() || draft.overview.trim(),
      overview: draft.overview.trim() || draft.shortDescription.trim(),
    };
    onSaveProject(cleaned);
    setIsEditing(false);
    setSaveNotice('Project details updated.');
    setTimeout(() => setSaveNotice(''), 3000);
  };

  const addListItem = (field: 'keyFeatures' | 'technologiesUsed', value: string, clear: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setDraft((prev) =>
      prev && !prev[field].includes(trimmed)
        ? { ...prev, [field]: [...prev[field], trimmed] }
        : prev,
    );
    clear();
  };

  const removeListItem = (field: 'keyFeatures' | 'technologiesUsed' | 'screenshots', index: number) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
          }
        : prev,
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} details`}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#111111] text-white"
    >
      {/* Top Bar inside Project Detail View */}
      <div className="sticky top-0 z-20 bg-[#212121]/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 text-sm font-medium text-zinc-300 hover:text-white rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B]"
          >
            <ArrowLeft className="w-4 h-4 text-[#109E6B]" />
            <span>Back to Projects</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {saveNotice && (
              <span className="text-xs font-medium text-[#109E6B] hidden sm:inline">
                {saveNotice}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[3px] border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B] ${
                isEditing
                  ? 'border-white/20 bg-[#191919] text-zinc-200 hover:bg-[#242424]'
                  : 'border-white/15 bg-[#191919] text-white hover:border-[#109E6B]/60'
              }`}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4 text-[#109E6B]" />}
              <span>{isEditing ? 'Cancel Edit' : 'Edit Project'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-8 bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Edit {project.name}
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Update links, demo video URL, project screenshot, and documented project details.
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            {uploadError && (
              <p role="alert" className="text-sm text-red-300 bg-red-950/60 border border-red-500/30 rounded-[3px] px-4 py-2.5">
                {uploadError}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Project Screenshot URL or Upload
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload image"
                    value={draft.coverImage.startsWith('data:') ? 'Uploaded screenshot' : draft.coverImage}
                    onChange={(e) => setDraft({ ...draft, coverImage: e.target.value })}
                    className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] text-white cursor-pointer shrink-0">
                    <Upload className="w-4 h-4 text-[#109E6B]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-live-project.com"
                  value={draft.liveDemoUrl}
                  onChange={(e) => setDraft({ ...draft, liveDemoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={draft.githubUrl}
                  onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Demo Video URL (YouTube, YouTube Unlisted, or Direct MP4 link)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://.../demo.mp4"
                  value={draft.demoVideoUrl}
                  onChange={(e) => setDraft({ ...draft, demoVideoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Leave empty to hide the Watch Demo button on this project card.
                </p>
              </div>
            </div>

            <div className="space-y-5 pt-2 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Card Summary
                </label>
                <textarea
                  rows={2}
                  value={draft.shortDescription}
                  onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Project Overview
                </label>
                <textarea
                  rows={3}
                  value={draft.overview}
                  onChange={(e) => setDraft({ ...draft, overview: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Problem Statement
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What real problem does this project address?"
                    value={draft.problemStatement}
                    onChange={(e) => setDraft({ ...draft, problemStatement: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Project Purpose
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Why did you build this project?"
                    value={draft.purpose}
                    onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Key Features (actual implemented features)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add a feature..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addListItem('keyFeatures', featureInput, () => setFeatureInput(''));
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addListItem('keyFeatures', featureInput, () => setFeatureInput(''))
                      }
                      className="px-3.5 py-2 text-sm font-medium rounded-[3px] bg-[#109E6B] text-white hover:bg-[#0D8A5D] shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {draft.keyFeatures.map((feat, idx) => (
                      <li
                        key={`${feat}-${idx}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm bg-[#121212] border border-white/10 rounded-[3px]"
                      >
                        <span className="truncate">{feat}</span>
                        <button
                          type="button"
                          onClick={() => removeListItem('keyFeatures', idx)}
                          aria-label={`Remove feature ${feat}`}
                          className="text-zinc-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Technologies Used (confirmed only)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add technology..."
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addListItem('technologiesUsed', techInput, () => setTechInput(''));
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addListItem('technologiesUsed', techInput, () => setTechInput(''))
                      }
                      className="px-3.5 py-2 text-sm font-medium rounded-[3px] bg-[#109E6B] text-white hover:bg-[#0D8A5D] shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {draft.technologiesUsed.map((tech, idx) => (
                      <li
                        key={`${tech}-${idx}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm bg-[#121212] border border-white/10 rounded-[3px]"
                      >
                        <span className="truncate">{tech}</span>
                        <button
                          type="button"
                          onClick={() => removeListItem('technologiesUsed', idx)}
                          aria-label={`Remove technology ${tech}`}
                          className="text-zinc-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  My Contribution
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe your role and specific contributions..."
                  value={draft.myContribution}
                  onChange={(e) => setDraft({ ...draft, myContribution: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Development Process
                  </label>
                  <textarea
                    rows={3}
                    placeholder="How did you plan, design, and build it?"
                    value={draft.developmentProcess}
                    onChange={(e) => setDraft({ ...draft, developmentProcess: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Challenges and Learning
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What obstacles did you face and what did you learn?"
                    value={draft.challengesAndLearning}
                    onChange={(e) => setDraft({ ...draft, challengesAndLearning: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Screenshots / Gallery
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    type="url"
                    placeholder="Add screenshot image URL..."
                    value={screenshotInput}
                    onChange={(e) => setScreenshotInput(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = screenshotInput.trim();
                      if (!trimmed) return;
                      setDraft({ ...draft, screenshots: [...draft.screenshots, trimmed] });
                      setScreenshotInput('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] bg-[#109E6B] text-white hover:bg-[#0D8A5D]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add URL</span>
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] cursor-pointer">
                    <Upload className="w-4 h-4 text-[#109E6B]" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleScreenshotUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>

                {draft.screenshots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {draft.screenshots.map((shot, idx) => (
                      <div
                        key={`edit-shot-${idx}`}
                        className="relative aspect-[4/3] rounded-[3px] overflow-hidden border border-white/10 bg-[#121212]"
                      >
                        <img
                          src={getSafeMediaUrl(shot) ?? ''}
                          alt={`${draft.name} screenshot ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem('screenshots', idx)}
                          aria-label={`Remove screenshot ${idx + 1}`}
                          className="absolute top-2 right-2 w-8 h-8 rounded-[3px] bg-black/80 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          <article className="space-y-10">
            <header className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <p className="text-sm font-medium text-[#109E6B]">Project Details</p>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {project.name}
                  </h1>
                  <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
                    {project.overview || project.shortDescription}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#191919] border border-white/15 hover:border-[#109E6B]/60 rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {parsedVideo && (
                    <a
                      href="#project-demo-video-section"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#191919] border border-white/15 hover:border-[#109E6B]/60 rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Play className="w-4 h-4 text-[#109E6B]" />
                      <span>Watch Demo</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="aspect-[16/9] sm:aspect-[21/9] w-full rounded-[4px] overflow-hidden border border-white/10 bg-[#191919]">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${project.name} screenshot`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                    <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                      {project.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      No project screenshot uploaded yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-[3px] bg-[#212121] border border-white/15 text-white hover:border-[#109E6B]"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#109E6B]" />
                      <span>Upload Screenshot</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            {parsedVideo && (
              <section
                id="project-demo-video-section"
                className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 sm:p-8 space-y-4"
              >
                <h2 className="font-display text-xl font-semibold text-white">
                  Project Demonstration Video
                </h2>
                <VideoPlayer
                  videoUrl={project.demoVideoUrl}
                  projectName={project.name}
                  fallbackCover={project.coverImage}
                />
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailBlock
                title="Project Overview"
                content={project.overview || project.shortDescription}
                onEdit={() => setIsEditing(true)}
              />
              <DetailBlock
                title="Problem Statement"
                content={project.problemStatement}
                onEdit={() => setIsEditing(true)}
              />
              <DetailBlock
                title="Project Purpose"
                content={project.purpose}
                onEdit={() => setIsEditing(true)}
              />
              <DetailBlock
                title="My Contribution"
                content={project.myContribution}
                onEdit={() => setIsEditing(true)}
              />
              <DetailBlock
                title="Development Process"
                content={project.developmentProcess}
                onEdit={() => setIsEditing(true)}
              />
              <DetailBlock
                title="Challenges and Learning"
                content={project.challengesAndLearning}
                onEdit={() => setIsEditing(true)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 space-y-3">
                <h2 className="font-display text-lg font-semibold text-white">
                  Key Features
                </h2>
                {project.keyFeatures.length > 0 ? (
                  <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">
                    {project.keyFeatures.map((feat, idx) => (
                      <li key={`${feat}-${idx}`}>{feat}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">
                    No features documented yet.{' '}
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-[#109E6B] hover:underline font-medium"
                    >
                      Add confirmed features
                    </button>
                  </p>
                )}
              </section>

              <section className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 space-y-3">
                <h2 className="font-display text-lg font-semibold text-white">
                  Technologies Used
                </h2>
                {project.technologiesUsed.length > 0 ? (
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {project.technologiesUsed.join(' · ')}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400">
                    No technologies confirmed yet.{' '}
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-[#109E6B] hover:underline font-medium"
                    >
                      Add confirmed stack
                    </button>
                  </p>
                )}
              </section>
            </div>

            <section className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-white">
                  Screenshots &amp; Gallery
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-[#109E6B] hover:underline"
                >
                  Manage Screenshots
                </button>
              </div>
              {project.screenshots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.screenshots.map((shot, idx) => (
                    <div
                      key={`gallery-${idx}`}
                      className="aspect-[4/3] rounded-[3px] overflow-hidden border border-white/10 bg-[#121212]"
                    >
                      <img
                        src={getSafeMediaUrl(shot) ?? ''}
                        alt={`${project.name} screenshot ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  No project screenshots added yet. Use Edit Project to upload or link screenshots.
                </p>
              )}
            </section>
          </article>
        )}
      </main>
    </div>
  );
}

function DetailBlock({
  title,
  content,
  onEdit,
}: {
  title: string;
  content: string;
  onEdit: () => void;
}) {
  return (
    <section className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 space-y-2.5">
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      {content ? (
        <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      ) : (
        <p className="text-sm text-zinc-400">
          Not added yet.{' '}
          <button
            type="button"
            onClick={onEdit}
            className="text-[#109E6B] hover:underline font-medium"
          >
            Add details
          </button>
        </p>
      )}
    </section>
  );
}
