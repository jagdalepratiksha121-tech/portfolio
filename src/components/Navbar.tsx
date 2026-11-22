import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  brandName: string;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Certificates' },
];

export function Navbar({ brandName, activeSection, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileOpen(false);
    onNavigate(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#212121]/95 backdrop-blur-sm border-b border-white/[0.06]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand mark matching reference */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-wider uppercase text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B] rounded-sm"
        >
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-xs bg-[#109E6B] inline-block rotate-12"
          />
          <span>{brandName}</span>
        </a>

        {/* Zone 2: Clean single-line nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B] rounded-sm ${
                  isActive
                    ? 'text-[#109E6B]'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary Contact action + mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contact');
            }}
            className={`hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-[3px] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B] ${
              activeSection === 'contact'
                ? 'bg-[#109E6B] text-white'
                : 'text-zinc-200 hover:text-[#109E6B]'
            }`}
          >
            Contact
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-[4px] border border-white/15 bg-[#191919] text-white hover:bg-[#262626] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-white/10 bg-[#181818] px-4 py-3 space-y-1"
        >
          {[...NAV_ITEMS, { id: 'education', label: 'Education' }, { id: 'contact', label: 'Contact' }].map(
            (item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.id);
                  }}
                  className={`flex items-center min-h-[44px] px-3 rounded-[4px] text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#109E6B]/15 text-[#109E6B]'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              );
            },
          )}
        </nav>
      )}
    </header>
  );
}
