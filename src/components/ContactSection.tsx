import { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Github,
  Linkedin,
  Mail,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ContactInfo, SocialLink } from '../types/portfolio';
import { getSafeExternalUrl, getSafeMediaUrl, readFileAsDataUrl } from '../utils/media';

interface ContactSectionProps {
  contact: ContactInfo;
  onUpdateContact: (next: ContactInfo) => void;
}

export function ContactSection({ contact, onUpdateContact }: ContactSectionProps) {
  const [editingLinks, setEditingLinks] = useState(false);
  const [draft, setDraft] = useState<ContactInfo>(contact);
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitReceipt, setSubmitReceipt] = useState<{
    id: string;
    receivedAt: string;
    forwarded: boolean;
  } | null>(null);

  const safeLinkedin = getSafeExternalUrl(contact.linkedinUrl);
  const safeGithub = getSafeExternalUrl(contact.githubUrl);
  const safeResume = getSafeMediaUrl(contact.resumePdfUrl);

  const openEditor = () => {
    setDraft(contact);
    setLinkError('');
    setEditingLinks(true);
  };

  const handleResumeUpload = async (file: File | undefined) => {
    if (!file) return;
    setLinkError('');
    if (file.type !== 'application/pdf') {
      setLinkError('Please select a PDF file for your resume.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file, 3 * 1024 * 1024);
      setDraft((prev) => ({
        ...prev,
        resumePdfUrl: dataUrl,
        resumeFileName: file.name,
      }));
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Could not read PDF file.');
    }
  };

  const handleAddSocial = () => {
    const label = newSocialLabel.trim();
    const url = getSafeExternalUrl(newSocialUrl);
    if (!label || !url) {
      setLinkError('Enter both a platform label and a valid https:// URL.');
      return;
    }
    setLinkError('');
    const nextItem: SocialLink = {
      id: `social-${Date.now()}`,
      label,
      url,
    };
    setDraft((prev) => ({
      ...prev,
      otherLinks: [...prev.otherLinks, nextItem],
    }));
    setNewSocialLabel('');
    setNewSocialUrl('');
  };

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateContact({
      ...draft,
      githubUrl: draft.githubUrl.trim(),
      resumePdfUrl: draft.resumePdfUrl.trim(),
      linkedinUrl: draft.linkedinUrl.trim(),
    });
    setEditingLinks(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitReceipt(null);

    if (name.trim().length < 2) {
      setSubmitError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 2) {
      setSubmitError('Please enter a subject.');
      return;
    }
    if (message.trim().length < 10) {
      setSubmitError('Please enter a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setSubmitError(
          payload.error || 'Submission could not be saved. Please email directly below.',
        );
        return;
      }
      setSubmitReceipt({
        id: payload.id,
        receivedAt: payload.receivedAt,
        forwarded: Boolean(payload.forwarded),
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setSubmitError(
        'Unable to reach the contact server right now. Please use the direct email link instead.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-[#151515] border-t border-white/[0.06] scroll-mt-16">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Direct Details & Editable Links */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#109E6B]">Get in Touch</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Contact Me
              </h2>
              <p className="text-[15px] text-zinc-400 leading-relaxed">
                Open to internship opportunities, project collaborations, and connecting with engineers, designers, and teams.
              </p>
            </div>

            <div className="bg-[#191919] border border-white/[0.06] rounded-[4px] p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-base font-semibold text-white">
                  Direct Channels
                </h3>
                <button
                  type="button"
                  onClick={editingLinks ? () => setEditingLinks(false) : openEditor}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#109E6B] hover:underline"
                >
                  {editingLinks ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Links</span>
                    </>
                  )}
                </button>
              </div>

              {!editingLinks ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#109E6B] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-400">Email</p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-zinc-100 font-medium hover:text-[#109E6B] break-all"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>

                  {safeLinkedin && (
                    <div className="flex items-start gap-3">
                      <Linkedin className="w-4 h-4 text-[#109E6B] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400">LinkedIn</p>
                        <a
                          href={safeLinkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-zinc-100 font-medium hover:text-[#109E6B] break-all"
                        >
                          <span>linkedin.com/in/pratiksha-jagdale-a95</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {safeGithub && (
                    <div className="flex items-start gap-3">
                      <Github className="w-4 h-4 text-[#109E6B] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400">GitHub</p>
                        <a
                          href={safeGithub}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-zinc-100 font-medium hover:text-[#109E6B] break-all"
                        >
                          <span>github.com/jagdalepratiksha121-tech</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {safeResume && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-[#109E6B] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400">Resume PDF</p>
                        <a
                          href={safeResume}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={contact.resumeFileName || 'Pratiksha_Jagdale_Resume.pdf'}
                          className="inline-flex items-center gap-1 text-[#109E6B] font-medium hover:underline"
                        >
                          <span>{contact.resumeFileName || 'View Resume PDF'}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {contact.otherLinks.map((item) => {
                    const valid = getSafeExternalUrl(item.url);
                    if (!valid) return null;
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <ExternalLink className="w-4 h-4 text-[#109E6B] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-400">{item.label}</p>
                          <a
                            href={valid}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-100 font-medium hover:text-[#109E6B] break-all"
                          >
                            {valid}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleSaveLinks} className="space-y-4">
                  {linkError && (
                    <p role="alert" className="text-xs text-red-300 bg-red-950/60 border border-red-500/30 rounded-[3px] px-3 py-2">
                      {linkError}
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={draft.githubUrl}
                      onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Resume PDF (URL or Upload PDF)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://.../resume.pdf"
                        value={draft.resumePdfUrl.startsWith('data:') ? draft.resumeFileName || 'Uploaded PDF' : draft.resumePdfUrl}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            resumePdfUrl: e.target.value,
                            resumeFileName: '',
                          })
                        }
                        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-[3px] border border-white/15 bg-[#222222] hover:bg-[#2B2B2B] text-white cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5 text-[#109E6B]" />
                        <span>PDF</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-300">
                      Other Social Links
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. Behance)"
                        value={newSocialLabel}
                        onChange={(e) => setNewSocialLabel(e.target.value)}
                        className="px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={newSocialUrl}
                          onChange={(e) => setNewSocialUrl(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                        />
                        <button
                          type="button"
                          onClick={handleAddSocial}
                          aria-label="Add social link"
                          className="px-3 py-2 rounded-[3px] bg-[#109E6B] text-white hover:bg-[#0D8A5D] shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {draft.otherLinks.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs bg-[#121212] border border-white/10 rounded-[3px] text-zinc-300"
                      >
                        <span className="truncate">
                          <strong className="text-white">{item.label}:</strong> {item.url}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              otherLinks: draft.otherLinks.filter((l) => l.id !== item.id),
                            })
                          }
                          aria-label={`Remove ${item.label}`}
                          className="text-zinc-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] rounded-[3px] transition-colors"
                  >
                    Save Contact Links
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Functional Contact Form */}
          <div className="lg:col-span-7 bg-[#191919] border border-white/[0.06] rounded-[4px] p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-white">
              Send a Message
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Messages submitted here are validated and saved directly to the portfolio server inbox.
            </p>

            <form onSubmit={handleSubmitForm} className="mt-6 space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-200 mb-1.5">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Internship inquiry, collaboration, or feedback"
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-[3px] border border-white/15 bg-[#121212] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#109E6B]"
                />
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-[3px] border border-red-500/30 bg-red-950/60 px-4 py-3 text-sm text-red-200 space-y-1.5"
                >
                  <p>{submitError}</p>
                  <a
                    href={`mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
                    className="inline-flex items-center gap-1.5 font-medium underline text-white"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in your email client instead</span>
                  </a>
                </div>
              )}

              {submitReceipt && (
                <div
                  role="status"
                  className="rounded-[3px] border border-emerald-500/30 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#109E6B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Message saved to portfolio inbox (Ref: {submitReceipt.id.slice(0, 8)}).
                    </p>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      {submitReceipt.forwarded
                        ? 'Also forwarded to Pratiksha via configured webhook.'
                        : `Recorded on ${new Date(submitReceipt.receivedAt).toLocaleString()}. You can also reach Pratiksha directly at ${contact.email}.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xs font-medium text-zinc-400 hover:text-[#109E6B] underline underline-offset-4"
                >
                  Prefer email? {contact.email}
                </a>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#109E6B] hover:bg-[#0D8A5D] disabled:opacity-60 rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919] focus-visible:ring-[#109E6B]"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
