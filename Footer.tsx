import { Sparkles } from 'lucide-react';
import { SiX, SiGithub } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';

const FOOTER_LINKS = {
  Product: ['Features', 'Templates', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Resources: ['Documentation', 'API Reference', 'Community', 'Support'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/20 bg-surface/50 py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold text-lg text-foreground">Echo</span>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Turn any web workflow into a native mobile app with AI.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="text-text-dim hover:text-foreground transition-colors" aria-label="X (Twitter)">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="text-text-dim hover:text-foreground transition-colors" aria-label="GitHub">
                <SiGithub className="w-4 h-4" />
              </a>
              <a href="#" className="text-text-dim hover:text-foreground transition-colors" aria-label="LinkedIn">
                <FaLinkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">{heading}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-muted hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-dim">© 2026 Echo. All rights reserved.</p>
          <p className="text-xs text-text-dim">Made with AI · Powered by Natively</p>
        </div>
      </div>
    </footer>
  );
}
