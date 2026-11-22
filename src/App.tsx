import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Braces,
  Camera,
  Code2,
  ExternalLink,
  FolderCog,
  Github,
  GraduationCap,
  ImagePlus,
  Layers,
  Layout,
  Palette,
  PenTool,
  Pencil,
  Play,
  Plus,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { DEFAULT_PORTFOLIO } from './data/defaultPortfolio';
import type {
  CertificateCategory,
  CertificateItem,
  ContactInfo,
  PortfolioData,
  ProjectItem,
  SkillCategory,
} from './types/portfolio';
import {
  getSafeExternalUrl,
  getSafeMediaUrl,
  parseDemoVideo,
  readFileAsDataUrl,
} from './utils/media';
import { Navbar } from './components/Navbar';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { CertificateLightbox } from './components/CertificateLightbox';
import { ContactSection } from './components/ContactSection';

const STORAGE_KEY = 'pratiksha_portfolio_v5';

function deduplicateCertificates(items: CertificateItem[]): CertificateItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.id}::${item.title.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeProjectImages(items: ProjectItem[]): ProjectItem[] {
  return items.map((item) => ({
    ...item,
    coverImage: item.coverImage.startsWith('/src/assets/images/project_')
      ? ''
      : item.coverImage,
  }));
}

function loadInitialPortfolio(): PortfolioData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PORTFOLIO;
    const parsed = JSON.parse(raw) as Partial<PortfolioData>;
    return {
      profile: {
        ...DEFAULT_PORTFOLIO.profile,
        ...(parsed.profile ?? {}),
      },
      education: {
        ...DEFAULT_PORTFOLIO.education,
        ...(parsed.education ?? {}),
      },
      skillCategories: Array.isArray(parsed.skillCategories)
        ? parsed.skillCategories
        : DEFAULT_PORTFOLIO.skillCategories,
      projects: Array.isArray(parsed.projects)
        ? sanitizeProjectImages(parsed.projects)
        : DEFAULT_PORTFOLIO.projects,
      certificates: Array.isArray(parsed.certificates)
        ? deduplicateCertificates(parsed.certificates)
        : DEFAULT_PORTFOLIO.certificates,
      contact: {
        ...DEFAULT_PORTFOLIO.contact,
        ...(parsed.contact ?? {}),
      },
    };
  } catch {
    return DEFAULT_PORTFOLIO;
  }
}

function getSkillIcon(skill: string) {
  const normalized = skill.toLowerCase();
  if (normalized === 'c') return Terminal;
  if (normalized === 'c++') return Code2;
  if (normalized.includes('javascript')) return Braces;
  if (normalized.includes('ui/ux')) return Layout;
  if (normalized.includes('graphic')) return Palette;
  if (normalized.includes('logo')) return PenTool;
  return Layers;
}

export default function App() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(loadInitialPortfolio);
  const [activeSection, setActiveSection] = useState<string>('home');

  // Project Detail & Link Management states
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetailTab, setProjectDetailTab] = useState<'overview' | 'video' | 'edit'>('overview');
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [projectUploadError, setProjectUploadError] = useState('');

  // Skill editing state
  const [editingSkills, setEditingSkills] = useState(false);
  const [newSkillByCat, setNewSkillByCat] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState('');

  // Achievements filter, lightbox & editing state
  const [certFilter, setCertFilter] = useState<string>('All');
  const [activeCertificate, setActiveCertificate] = useState<CertificateItem | null>(null);
  const [editingCerts, setEditingCerts] = useState(false);
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [newCertCategory, setNewCertCategory] = useState<CertificateCategory>('Technical & AI');
  const [newCertImage, setNewCertImage] = useState('');
  const [certFormError, setCertFormError] = useState('');

  // Photo upload feedback
  const [photoError, setPhotoError] = useState('');
  const [profilePhotoBroken, setProfilePhotoBroken] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch {
      // Ignore quota errors while keeping memory state active
    }
  }, [portfolio]);

  useEffect(() => {
    const sectionIds = [
      'home',
      'about',
      'skills',
      'projects',
      'education',
      'achievements',
      'contact',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-22% 0px -58% 0px',
        threshold: [0.1, 0.25, 0.5],
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const selectedProject = useMemo(
    () => portfolio.projects.find((p) => p.id === selectedProjectId) ?? null,
    [portfolio.projects, selectedProjectId],
  );

  const openProjectDetail = (
    projectId: string,
    tab: 'overview' | 'video' | 'edit' = 'overview',
  ) => {
    setProjectDetailTab(tab);
    setSelectedProjectId(projectId);
  };

  const handleSaveProject = (updated: ProjectItem) => {
    setPortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const handleSaveAllProjects = (nextProjects: ProjectItem[]) => {
    setPortfolio((prev) => ({ ...prev, projects: nextProjects }));
  };

  const handleDirectProjectImageUpload = async (
    projectId: string,
    file: File | undefined,
  ) => {
    if (!file) return;
    setProjectUploadError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPortfolio((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, coverImage: dataUrl } : p,
        ),
      }));
    } catch (err) {
      setProjectUploadError(
        err instanceof Error ? err.message : 'Unable to upload project screenshot.',
      );
    }
  };

  const handleProfilePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProfilePhotoBroken(false);
      setPortfolio((prev) => ({
        ...prev,
        profile: { ...prev.profile, photoUrl: dataUrl },
      }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to upload photo.');
    }
  };

  // Skills management handlers
  const handleAddSkill = (categoryId: string) => {
    const value = (newSkillByCat[categoryId] ?? '').trim();
    if (!value) return;
    setPortfolio((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.map((cat) =>
        cat.id === categoryId && !cat.skills.includes(value)
          ? { ...cat, skills: [...cat.skills, value] }
          : cat,
      ),
    }));
    setNewSkillByCat((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveSkill = (categoryId: string, skillName: string) => {
    setPortfolio((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, skills: cat.skills.filter((s) => s !== skillName) }
          : cat,
      ),
    }));
  };

  const handleAddSkillCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const newCat: SkillCategory = {
      id: `cat-${Date.now()}`,
      name,
      skills: [],
    };
    setPortfolio((prev) => ({
      ...prev,
      skillCategories: [...prev.skillCategories, newCat],
    }));
    setNewCategoryName('');
  };

  // Flatten skills for the reference 3x2 grid cards
  const flattenedSkills = useMemo(
    () =>
      portfolio.skillCategories.flatMap((cat) =>
        cat.skills.map((skill) => ({
          categoryId: cat.id,
          categoryName: cat.name,
          skill,
        })),
      ),
    [portfolio.skillCategories],
  );

  // Achievements / Certificates handlers
  const availableCertCategories = useMemo(() => {
    const cats = Array.from(new Set(portfolio.certificates.map((c) => c.category)));
    return ['All', ...cats];
  }, [portfolio.certificates]);

  const filteredCertificates = useMemo(() => {
    if (certFilter === 'All') return portfolio.certificates;
    return portfolio.certificates.filter((c) => c.category === certFilter);
  }, [portfolio.certificates, certFilter]);

  const handleCertImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setCertFormError('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setNewCertImage(dataUrl);
    } catch (err) {
      setCertFormError(err instanceof Error ? err.message : 'Could not load image.');
    }
  };

  const handleAddCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    setCertFormError('');
    const title = newCertTitle.trim();
    const issuer = newCertIssuer.trim();
    if (!title || !issuer) {
      setCertFormError('Title and issuer are required.');
      return;
    }
    if (!newCertImage.trim()) {
      setCertFormError('Please provide or upload a certificate image (not PDF).');
      return;
    }
    const duplicate = portfolio.certificates.some(
      (c) => c.title.trim().toLowerCase() === title.toLowerCase(),
    );
    if (duplicate) {
      setCertFormError('This certificate is already added.');
      return;
    }

    const entry: CertificateItem = {
      id: `cert-${Date.now()}`,
      title,
      issuer,
      date: newCertDate.trim(),
      credentialId: '',
      category: newCertCategory,
      imageUrl: newCertImage.trim(),
      details: '',
    };

    setPortfolio((prev) => ({
      ...prev,
      certificates: [entry, ...prev.certificates],
    }));
    setNewCertTitle('');
    setNewCertIssuer('');
    setNewCertDate('');
    setNewCertImage('');
  };

  const handleRemoveCertificate = (id: string) => {
    setPortfolio((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((c) => c.id !== id),
    }));
  };

  const handleUpdateContact = (next: ContactInfo) => {
    setPortfolio((prev) => ({ ...prev, contact: next }));
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(portfolio, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pratiksha-jagdale-portfolio.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<PortfolioData>;
      setPortfolio({
        profile: { ...DEFAULT_PORTFOLIO.profile, ...(parsed.profile ?? {}) },
        education: { ...DEFAULT_PORTFOLIO.education, ...(parsed.education ?? {}) },
        skillCategories: Array.isArray(parsed.skillCategories)
          ? parsed.skillCategories
          : DEFAULT_PORTFOLIO.skillCategories,
        projects: Array.isArray(parsed.projects)
          ? sanitizeProjectImages(parsed.projects)
          : DEFAULT_PORTFOLIO.projects,
        certificates: Array.isArray(parsed.certificates)
          ? deduplicateCertificates(parsed.certificates)
          : DEFAULT_PORTFOLIO.certificates,
        contact: { ...DEFAULT_PORTFOLIO.contact, ...(parsed.contact ?? {}) },
      });
    } catch {
      // Handled inside ProjectManagerModal
    }
  };

  const handleResetDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPortfolio(DEFAULT_PORTFOLIO);
    setProfilePhotoBroken(false);
  };

  const safeProfilePhoto = getSafeMediaUrl(portfolio.profile.photoUrl);
  const safeResumeUrl = getSafeMediaUrl(portfolio.contact.resumePdfUrl);

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col overflow-x-hidden">
      <Navbar
        brandName="PRATIKSHA"
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="flex-1">
        {/* 1. HERO SECTION — Dark #212121 Reference Layout */}
        <section id="home" className="bg-[#212121] border-b border-white/[0.06] pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Typographic Hero Area */}
              <div className="lg:col-span-7 space-y-5">
                <p className="text-base sm:text-lg font-light text-zinc-200">
                  Hi There!
                </p>
                <h1
                  className="font-display font-bold tracking-tight text-white leading-[1.12]"
                  style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.6rem)', textWrap: 'balance' }}
                >
                  PRATIKSHA JAGDALE
                  <span aria-hidden="true" className="font-light text-zinc-300 ml-1">
                    |
                  </span>
                </h1>
                <p className="text-base sm:text-lg font-normal text-zinc-300 max-w-2xl">
                  {portfolio.profile.identity}
                </p>
                <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed max-w-xl">
                  {portfolio.profile.heroIntro}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('contact');
                    }}
                    className="inline-flex items-center justify-center min-h-[42px] px-6 py-2.5 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Contact Me
                  </a>
                  <a
                    href="#projects"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('projects');
                    }}
                    className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 text-sm font-medium text-zinc-200 border border-white/15 hover:border-[#109E6B] hover:text-white rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explore Projects</span>
                    <ArrowRight className="w-4 h-4 text-[#109E6B]" />
                  </a>
                </div>
              </div>

              {/* Right Monochrome Hero Visual (seamless dark-blended placement matching reference) */}
              <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[3/4] overflow-hidden">
                  <img
                    src="/src/assets/images/hero_monochrome_editorial_1795250664590.jpg"
                    alt="Monochrome editorial studio visual"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-90"
                  />
                  {/* Seamless vignette fade into #212121 hero canvas */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#212121] via-transparent to-[#212121]/70"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#212121] via-transparent to-[#212121]/60"
                  />
                </div>

                {/* Subtle circular focus marker matching reference hero right */}
                <div
                  aria-hidden="true"
                  className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/25 items-center justify-center shrink-0"
                >
                  <span className="w-1 h-1 rounded-full bg-white/80" />
                </div>
              </div>
            </div>

            {/* Hero Bottom Info Strip with Vertical Hairline Dividers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/[0.08]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 flex-1 max-w-3xl">
                <div className="sm:pr-6 sm:border-r sm:border-white/10">
                  <p className="text-xs font-semibold text-white">Email</p>
                  <a
                    href={`mailto:${portfolio.contact.email}`}
                    className="text-xs text-zinc-400 hover:text-[#109E6B] mt-1 inline-block break-all"
                  >
                    {portfolio.contact.email}
                  </a>
                </div>
                <div className="sm:px-6 sm:border-r sm:border-white/10">
                  <p className="text-xs font-semibold text-white">Education</p>
                  <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                    B.Tech AI &amp; DS · CGPA {portfolio.education.cgpa}
                  </p>
                </div>
                <div className="sm:pl-6">
                  <p className="text-xs font-semibold text-white">LinkedIn</p>
                  <a
                    href={getSafeExternalUrl(portfolio.contact.linkedinUrl) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-[#109E6B] mt-1 inline-block"
                  >
                    linkedin.com/in/pratiksha-jagdale-a95
                  </a>
                </div>
              </div>

              {/* Minimal Mouse Scroll Cue */}
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                aria-label="Scroll to About section"
                className="hidden md:flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition-colors shrink-0"
              >
                <span className="w-5 h-8 rounded-full border border-white/40 flex items-start justify-center p-1.5">
                  <span className="w-0.5 h-1.5 rounded-full bg-white/80" />
                </span>
                <span className="w-px h-3 bg-white/30" />
              </button>
            </div>
          </div>
        </section>

        {/* 2. WHO AM I? / ABOUT ME SECTION — Exact Reference Two-Column Layout */}
        <section id="about" className="py-16 sm:py-24 bg-[#111111] scroll-mt-16">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Full-Color Square/Portrait Photo Container */}
              <div className="md:col-span-5 flex flex-col items-start">
                <div className="relative w-full max-w-[300px] aspect-[4/5] rounded-[3px] overflow-hidden border border-white/10 bg-white">
                  {safeProfilePhoto && !profilePhotoBroken ? (
                    <img
                      src={safeProfilePhoto}
                      alt="Pratiksha Jagdale"
                      referrerPolicy="no-referrer"
                      onError={() => setProfilePhotoBroken(true)}
                      className="w-full h-full object-contain object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#191919] text-2xl font-display font-bold text-zinc-400">
                      PJ
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[3px] border border-white/15 bg-[#191919] text-zinc-200 hover:border-[#109E6B] hover:text-white cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5 text-[#109E6B]" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleProfilePhotoUpload(e.target.files?.[0])}
                    />
                  </label>
                  {photoError && (
                    <span role="alert" className="text-xs text-red-400">
                      {photoError}
                    </span>
                  )}
                </div>
              </div>

              {/* Right "Who am I?" Editorial Bio */}
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-[#109E6B]">Who am I?</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                    I&apos;m Pratiksha Jagdale, an AI &amp; Data Science Student and Developer
                  </h2>
                </div>

                <div className="space-y-3.5 text-sm sm:text-[15px] text-zinc-400 leading-[1.75]">
                  {portfolio.profile.aboutParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
                  <p className="text-zinc-400">
                    <span className="font-semibold text-white mr-2">Name:</span>
                    {portfolio.profile.name}
                  </p>
                  <p className="text-zinc-400">
                    <span className="font-semibold text-white mr-2">Degree:</span>
                    B.Tech (AI &amp; Data Science)
                  </p>
                  <p className="text-zinc-400">
                    <span className="font-semibold text-white mr-2">Year:</span>
                    {portfolio.education.yearStatus} (Grad. {portfolio.education.expectedGraduation})
                  </p>
                  <p className="text-zinc-400 break-all">
                    <span className="font-semibold text-white mr-2">Email:</span>
                    {portfolio.contact.email}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#projects"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('projects');
                    }}
                    className="inline-flex items-center justify-center min-h-[42px] px-6 py-2.5 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors"
                  >
                    Explore My Projects
                  </a>
                  {safeResumeUrl && (
                    <a
                      href={safeResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={portfolio.contact.resumeFileName || 'Pratiksha_Jagdale_Resume.pdf'}
                      className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 text-sm font-medium text-zinc-200 border border-white/15 hover:border-[#109E6B] rounded-[3px] transition-colors"
                    >
                      Download CV
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MY SKILLS SECTION — Exact 3x2 Dark Surface Card Grid from Reference */}
        <section id="skills" className="py-16 sm:py-20 bg-[#111111] border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#109E6B]">Capabilities</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  My Skills
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingSkills((prev) => !prev)}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs sm:text-sm font-medium rounded-[3px] border border-white/15 bg-[#191919] text-zinc-200 hover:border-[#109E6B] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {editingSkills ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4 text-[#109E6B]" />}
                <span>{editingSkills ? 'Done Editing' : 'Edit Skills'}</span>
              </button>
            </div>

            {/* 3x2 Dark Grid matching reference card rhythm */}
            {!editingSkills ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {flattenedSkills.map(({ categoryId, categoryName, skill }) => {
                  const Icon = getSkillIcon(skill);
                  return (
                    <div
                      key={`${categoryId}-${skill}`}
                      className="bg-[#191919] border border-white/[0.04] hover:border-[#109E6B]/40 rounded-[3px] p-7 sm:p-8 space-y-4 transition-colors"
                    >
                      <Icon className="w-8 h-8 text-[#109E6B]" strokeWidth={1.6} />
                      <div className="space-y-1.5">
                        <h3 className="font-display text-lg font-semibold text-white">
                          {skill}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {categoryName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolio.skillCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 space-y-4"
                    >
                      <h3 className="font-display text-lg font-semibold text-white">
                        {category.name}
                      </h3>

                      {category.skills.length > 0 ? (
                        <ul className="divide-y divide-white/10">
                          {category.skills.map((skill) => (
                            <li
                              key={skill}
                              className="py-2.5 flex items-center justify-between gap-3 text-sm text-zinc-200"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(category.id, skill)}
                                aria-label={`Remove ${skill}`}
                                className="text-zinc-400 hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-400">No skills in this category yet.</p>
                      )}

                      <div className="pt-2 flex gap-2">
                        <input
                          type="text"
                          placeholder={`Add ${category.name.toLowerCase()} skill...`}
                          value={newSkillByCat[category.id] ?? ''}
                          onChange={(e) =>
                            setNewSkillByCat((prev) => ({
                              ...prev,
                              [category.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill(category.id);
                            }
                          }}
                          className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSkill(category.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-[3px] bg-[#109E6B] text-white hover:bg-[#0D8A5D] shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-4 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="New skill category (e.g. Tools)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkillCategory();
                      }
                    }}
                    className="flex-1 min-w-[200px] px-3.5 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkillCategory}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-[3px] bg-[#109E6B] text-white hover:bg-[#0D8A5D] shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. FEATURED PROJECTS SECTION — Strictly Software & Design Projects Only */}
        <section id="projects" className="py-16 sm:py-20 bg-[#151515] border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-sm font-medium text-[#109E6B]">Portfolio</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Featured Projects
                </h2>
                <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
                  Software and design projects I am building. Upload your actual project screenshots, edit descriptions, or update each project&apos;s Live Demo, GitHub, and Demo Video URLs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProjectManagerOpen(true)}
                className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-medium rounded-[3px] border border-white/15 bg-[#191919] text-zinc-200 hover:border-[#109E6B] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <FolderCog className="w-4 h-4 text-[#109E6B]" />
                <span>Manage Project Links</span>
              </button>
            </div>

            {projectUploadError && (
              <p role="alert" className="text-sm text-red-300 bg-red-950/60 border border-red-500/30 rounded-[3px] px-4 py-2.5">
                {projectUploadError}
              </p>
            )}

            {portfolio.projects.length === 0 ? (
              <div className="bg-[#191919] border border-white/[0.06] rounded-[4px] p-10 text-center space-y-3">
                <p className="text-base font-medium text-white">No projects added yet.</p>
                <button
                  type="button"
                  onClick={() => setProjectManagerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#109E6B] rounded-[3px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {portfolio.projects.map((project, index) => {
                  const liveUrl = getSafeExternalUrl(project.liveDemoUrl);
                  const githubUrl = getSafeExternalUrl(project.githubUrl);
                  const parsedVideo = parseDemoVideo(project.demoVideoUrl);
                  const coverUrl = getSafeMediaUrl(project.coverImage);

                  return (
                    <article
                      key={project.id}
                      className="bg-[#191919] border border-white/[0.06] hover:border-[#109E6B]/40 rounded-[4px] overflow-hidden flex flex-col transition-colors"
                    >
                      {/* Actual Project Screenshot OR Clean Neutral Dark Placeholder with Upload */}
                      <div className="relative aspect-[16/10] w-full bg-[#212121] border-b border-white/[0.06] overflow-hidden">
                        {coverUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openProjectDetail(project.id, 'overview')}
                              aria-label={`Open details for ${project.name}`}
                              className="w-full h-full block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#109E6B]"
                            >
                              <img
                                src={coverUrl}
                                alt={`${project.name} screenshot`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[3px] bg-[#191919]/95 text-white border border-white/15 hover:border-[#109E6B] cursor-pointer shadow-sm">
                              <Upload className="w-3.5 h-3.5 text-[#109E6B]" />
                              <span>Change Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) =>
                                  handleDirectProjectImageUpload(project.id, e.target.files?.[0])
                                }
                              />
                            </label>
                          </>
                        ) : (
                          <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center gap-3">
                            <span className="font-mono text-xs text-zinc-500 tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <p className="font-display text-2xl font-bold tracking-tight text-white">
                              {project.name}
                            </p>
                            <p className="text-xs text-zinc-400 max-w-[260px]">
                              No project screenshot uploaded yet.
                            </p>
                            <label className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-[3px] bg-[#191919] border border-white/15 text-zinc-200 hover:border-[#109E6B] hover:text-white cursor-pointer transition-colors">
                              <ImagePlus className="w-3.5 h-3.5 text-[#109E6B]" />
                              <span>Upload Screenshot</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) =>
                                  handleDirectProjectImageUpload(project.id, e.target.files?.[0])
                                }
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-xs text-[#109E6B] tabular-nums">
                              Project {String(index + 1).padStart(2, '0')}
                            </span>
                            <button
                              type="button"
                              onClick={() => openProjectDetail(project.id, 'edit')}
                              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-[#109E6B] transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>

                          <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white">
                            <button
                              type="button"
                              onClick={() => openProjectDetail(project.id, 'overview')}
                              className="text-left hover:text-[#109E6B] transition-colors focus-visible:outline-none focus-visible:underline"
                            >
                              {project.name}
                            </button>
                          </h3>

                          <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
                            {project.shortDescription}
                          </p>

                          {project.technologiesUsed.length > 0 && (
                            <p className="text-xs text-zinc-400 pt-1">
                              {project.technologiesUsed.join(' · ')}
                            </p>
                          )}
                        </div>

                        {/* Separate Independent Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.08]">
                          {liveUrl && (
                            <a
                              href={liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>Live Demo</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {githubUrl && (
                            <a
                              href={githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#141414] border border-white/15 hover:border-[#109E6B] hover:text-white rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>GitHub</span>
                            </a>
                          )}

                          {parsedVideo && (
                            <button
                              type="button"
                              onClick={() => openProjectDetail(project.id, 'video')}
                              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#141414] border border-white/15 hover:border-[#109E6B] hover:text-white rounded-[3px] transition-colors whitespace-nowrap shrink-0"
                            >
                              <Play className="w-3.5 h-3.5 text-[#109E6B]" />
                              <span>Watch Demo</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openProjectDetail(project.id, 'overview')}
                            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-medium text-zinc-300 hover:text-[#109E6B] rounded-[3px] transition-colors whitespace-nowrap shrink-0 ml-auto"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 5. EDUCATION SECTION */}
        <section id="education" className="py-16 sm:py-20 bg-[#111111] border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-[#109E6B]">Academic Background</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Education
              </h2>
            </div>

            <div className="rounded-[4px] border border-white/[0.06] bg-[#191919] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#109E6B]">
                  <GraduationCap className="w-4 h-4" />
                  <span>{portfolio.education.yearStatus}</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
                  {portfolio.education.degree}
                </h3>
                <p className="text-sm sm:text-base text-zinc-300">
                  {portfolio.education.institution}
                </p>
              </div>

              <div className="md:col-span-4 grid grid-cols-2 gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-6">
                <div>
                  <p className="text-xs text-zinc-400">CGPA</p>
                  <p className="font-mono text-lg font-medium text-white tabular-nums mt-0.5">
                    {portfolio.education.cgpa}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Graduation</p>
                  <p className="font-mono text-lg font-medium text-white tabular-nums mt-0.5">
                    {portfolio.education.expectedGraduation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CERTIFICATES & ACHIEVEMENTS SECTION — Strictly Separate From Projects */}
        <section id="achievements" className="py-16 sm:py-20 bg-[#111111] border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-sm font-medium text-[#109E6B]">Credentials</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Certificates &amp; Achievements
                </h2>
                <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
                  Verified certificates, internships, workshops, and competitions. Click any certificate image to inspect it in full view.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingCerts((prev) => !prev)}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs sm:text-sm font-medium rounded-[3px] border border-white/15 bg-[#191919] text-zinc-200 hover:border-[#109E6B] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {editingCerts ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 text-[#109E6B]" />}
                <span>{editingCerts ? 'Close Manager' : 'Manage Certificates'}</span>
              </button>
            </div>

            {editingCerts && (
              <form
                onSubmit={handleAddCertificate}
                className="bg-[#191919] border border-white/[0.08] rounded-[4px] p-6 space-y-4"
              >
                <h3 className="font-display text-base font-semibold text-white">
                  Add New Certificate Image
                </h3>
                {certFormError && (
                  <p role="alert" className="text-xs text-red-300 bg-red-950/60 border border-red-500/30 rounded-[3px] px-3 py-2">
                    {certFormError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Certificate Title"
                    value={newCertTitle}
                    onChange={(e) => setNewCertTitle(e.target.value)}
                    className="px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <input
                    type="text"
                    placeholder="Issuing Organization"
                    value={newCertIssuer}
                    onChange={(e) => setNewCertIssuer(e.target.value)}
                    className="px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <input
                    type="text"
                    placeholder="Date (e.g. Oct 2026)"
                    value={newCertDate}
                    onChange={(e) => setNewCertDate(e.target.value)}
                    className="px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <select
                    value={newCertCategory}
                    onChange={(e) => setNewCertCategory(e.target.value as CertificateCategory)}
                    className="px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  >
                    <option value="Technical & AI">Technical &amp; AI</option>
                    <option value="Design & Hackathons">Design &amp; Hackathons</option>
                    <option value="Internship & Industry">Internship &amp; Industry</option>
                    <option value="Business & Communication">Business &amp; Communication</option>
                    <option value="Community & Campus">Community &amp; Campus</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Certificate Image URL..."
                    value={newCertImage}
                    onChange={(e) => setNewCertImage(e.target.value)}
                    className="flex-1 min-w-[220px] px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] cursor-pointer">
                    <Upload className="w-4 h-4 text-[#109E6B]" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleCertImageUpload(e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px]"
                  >
                    Add Certificate
                  </button>
                </div>
              </form>
            )}

            {portfolio.certificates.length > 0 && (
              <div
                role="tablist"
                aria-label="Filter certificates by category"
                className="flex flex-wrap items-center gap-1.5 p-1 bg-[#191919] border border-white/[0.06] rounded-[4px] w-fit max-w-full"
              >
                {availableCertCategories.map((cat) => {
                  const active = certFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCertFilter(cat)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#109E6B] text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredCertificates.length === 0 ? (
              <div className="bg-[#191919] border border-white/[0.06] rounded-[4px] p-10 text-center space-y-2">
                <Award className="w-7 h-7 text-[#109E6B] mx-auto" />
                <p className="text-base font-medium text-white">
                  No certificates or achievements added yet.
                </p>
                <p className="text-sm text-zinc-400">
                  Use Manage Certificates to upload verified certificate images.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCertificates.map((cert) => {
                  const safeImg = getSafeMediaUrl(cert.imageUrl);
                  return (
                    <article
                      key={cert.id}
                      className="bg-[#191919] border border-white/[0.06] hover:border-[#109E6B]/40 rounded-[4px] overflow-hidden flex flex-col transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCertificate(cert)}
                        aria-label={`View ${cert.title} certificate`}
                        className="group relative aspect-[4/3] w-full bg-[#141414] overflow-hidden border-b border-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#109E6B]"
                      >
                        {safeImg ? (
                          <img
                            src={safeImg}
                            alt={cert.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                            Image unavailable
                          </div>
                        )}
                      </button>

                      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>{cert.category}</span>
                            {cert.date && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{cert.date}</span>
                              </>
                            )}
                          </div>
                          <h3 className="font-display text-base font-semibold text-white leading-snug">
                            <button
                              type="button"
                              onClick={() => setActiveCertificate(cert)}
                              className="text-left hover:text-[#109E6B] transition-colors"
                            >
                              {cert.title}
                            </button>
                          </h3>
                          <p className="text-sm text-zinc-400">{cert.issuer}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => setActiveCertificate(cert)}
                            className="text-xs font-medium text-[#109E6B] hover:underline"
                          >
                            View Certificate
                          </button>
                          {editingCerts && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCertificate(cert.id)}
                              aria-label={`Remove ${cert.title}`}
                              className="text-zinc-400 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 7. CONTACT SECTION */}
        <ContactSection
          contact={portfolio.contact}
          onUpdateContact={handleUpdateContact}
        />
      </main>

      {/* Clean Dark Footer */}
      <footer className="border-t border-white/[0.06] bg-[#111111]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>
            © {new Date().getFullYear()} {portfolio.profile.name}. B.Tech AI &amp; Data Science.
          </p>
          <div className="flex items-center gap-6">
            <a
              href={`mailto:${portfolio.contact.email}`}
              className="hover:text-[#109E6B] transition-colors"
            >
              Email
            </a>
            {getSafeExternalUrl(portfolio.contact.linkedinUrl) && (
              <a
                href={getSafeExternalUrl(portfolio.contact.linkedinUrl) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#109E6B] transition-colors"
              >
                LinkedIn
              </a>
            )}
            {getSafeExternalUrl(portfolio.contact.githubUrl) && (
              <a
                href={getSafeExternalUrl(portfolio.contact.githubUrl) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#109E6B] transition-colors"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* Modals & Detail Views */}
      <ProjectDetailModal
        project={selectedProject}
        initialTab={projectDetailTab}
        onClose={() => setSelectedProjectId(null)}
        onSaveProject={handleSaveProject}
      />

      <ProjectManagerModal
        open={projectManagerOpen}
        projects={portfolio.projects}
        onClose={() => setProjectManagerOpen(false)}
        onSaveProjects={handleSaveAllProjects}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetDefaults={handleResetDefaults}
      />

      <CertificateLightbox
        certificate={activeCertificate}
        onClose={() => setActiveCertificate(null)}
      />
    </div>
  );
}
