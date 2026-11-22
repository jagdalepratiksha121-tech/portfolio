export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  shortDescription: string;
  coverImage: string;
  liveDemoUrl: string;
  githubUrl: string;
  demoVideoUrl: string;
  overview: string;
  problemStatement: string;
  purpose: string;
  keyFeatures: string[];
  technologiesUsed: string[];
  myContribution: string;
  screenshots: string[];
  developmentProcess: string;
  challengesAndLearning: string;
}

export type CertificateCategory =
  | 'Technical & AI'
  | 'Design & Hackathons'
  | 'Internship & Industry'
  | 'Business & Communication'
  | 'Community & Campus';

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  category: CertificateCategory;
  imageUrl: string;
  details: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface ContactInfo {
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  resumePdfUrl: string;
  resumeFileName: string;
  otherLinks: SocialLink[];
}

export interface PortfolioData {
  profile: {
    name: string;
    identity: string;
    heroIntro: string;
    aboutParagraphs: string[];
    photoUrl: string;
  };
  education: {
    degree: string;
    institution: string;
    yearStatus: string;
    cgpa: string;
    expectedGraduation: string;
  };
  skillCategories: SkillCategory[];
  projects: ProjectItem[];
  certificates: CertificateItem[];
  contact: ContactInfo;
}
