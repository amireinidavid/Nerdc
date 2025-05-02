"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";

// Define link groups for the footer
const footerLinks = [
  {
    title: "Journals",
    links: [
      { label: "Browse All", href: "/journals" },
      { label: "By Subject", href: "/journals/subjects" },
      { label: "Open Access", href: "/journals/open-access" },
      { label: "Most Cited", href: "/journals/most-cited" },
      { label: "New Releases", href: "/journals/new" },
    ],
  },
  {
    title: "Authors",
    links: [
      { label: "Submit Paper", href: "/submit" },
      { label: "Submission Guidelines", href: "/guidelines" },
      { label: "Editorial Process", href: "/process" },
      { label: "Publication Ethics", href: "/ethics" },
      { label: "Author Resources", href: "/resources" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Mission", href: "/about" },
      { label: "Editorial Board", href: "/editors" },
      { label: "Careers", href: "/careers" },
      { label: "Press Releases", href: "/press" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

// Social media links
const socialLinks = [
  { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
];

export function Footer() {
  return (
    <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 pt-16 pb-8">
      <Container>
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
                <div className="absolute inset-0 bg-purple-500 mix-blend-overlay opacity-40"></div>
              </div>
              <div className="ml-3">
                <span className="font-bold text-xl text-white tracking-tight">
                  Nerdc <span className="text-purple-400">Journal</span>
                </span>
              </div>
            </div>
            <p className="text-white/60 mb-6 max-w-sm">
              Advancing knowledge through quality research publication. We connect academics, researchers, and curious minds with groundbreaking discoveries.
            </p>
            
            {/* Newsletter signup */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Stay Updated</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                  Subscribe
                </button>
              </div>
              <p className="text-white/40 text-xs mt-2">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
            
            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-500/20 transition-colors"
                  aria-label={social.label}
                >
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </div>
          </div>
          
          {/* Footer navigation links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-medium text-white mb-4">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-white/60 hover:text-purple-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom section with copyright and legal links */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/50 text-sm">
            © {new Date().getFullYear()} Nerdc Journal. All rights reserved.
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/terms" className="text-white/50 text-sm hover:text-purple-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-white/50 text-sm hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-white/50 text-sm hover:text-purple-400 transition-colors">
              Cookie Policy
            </Link>
            <Link href="/accessibility" className="text-white/50 text-sm hover:text-purple-400 transition-colors">
              Accessibility
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// Social media icons component
function SocialIcon({ name }: { name: string }) {
  switch (name) {
    case 'twitter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
        </svg>
      );
    case 'facebook':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
      );
    case 'linkedin':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect x="2" y="9" width="4" height="12"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      );
    case 'instagram':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    default:
      return null;
  }
}