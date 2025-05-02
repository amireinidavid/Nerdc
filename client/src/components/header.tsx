"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useResponsiveValue } from "@/hooks/useResponsive";
import { Container } from "@/components/ui/container";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";
import Image from "next/image";

// Regular user navigation links
const userLinks = [
  { href: "/", label: "Home" },
  { href: "/journals", label: "Journals" },
  { href: "/my-journals", label: "My Journals" },
  { href: "/contact", label: "Contact" },
];

// Admin navigation links
const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/upload-assessed", label: "Upload Assessed" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/published", label: "Published" },
  { href: "/admin/settings", label: "Settings" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout, isAdmin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Determine which links to show based on user role
  const navigationLinks = isAdmin() ? adminLinks : userLinks;

  // Track scroll position to change header style when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/');
  };

  // Check if a link is active
  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm py-3" : "bg-transparent py-5"
      } ${isAdmin() ? "border-b border-emerald-800/10" : ""}`}
    >
      <Container className="flex items-center justify-between">
        {/* Logo */}
        <Link 
          href={isAdmin() ? "/admin" : "/"}
          className="flex items-center relative z-50 group"
        >
          <div className="flex items-center">
            <div className="h-8 w-8 sm:h-10 sm:w-10 relative overflow-hidden rounded-lg flex items-center justify-center shrink-0">
              <Image 
                src="/assets/logo.jpg" 
                alt="NERDC Logo" 
                width={40} 
                height={40} 
                className="object-cover"
              />
            </div>
            <div className="ml-2 sm:ml-3">
              <div className="font-bold text-base sm:text-lg md:text-xl text-gray-800 tracking-tight hidden md:block max-w-[600px] truncate">
                <span className="hidden xl:inline">Nigerian Educational Research and Development Council</span>
                <span className="xl:hidden lg:inline">NERDC</span>
                <span className="text-emerald-600"> Journal</span>
                {isAdmin() && <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Admin</span>}
              </div>
              <div className="font-bold text-sm sm:text-base text-gray-800 tracking-tight md:hidden">
                <span className="inline-block">NERDC</span> <span className="text-emerald-600">Journal</span>
                {isAdmin() && <span className="ml-1 text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">Admin</span>}
              </div>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 text-sm">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-gray-700 hover:text-emerald-600 transition-colors relative 
                ${isLinkActive(link.href) 
                  ? "text-emerald-600 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-emerald-500" 
                  : "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-emerald-500 after:transition-all hover:after:w-1/2"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Login Button or User Profile - Desktop */}
        <div className="hidden lg:block">
          {!user ? (
            <button 
              onClick={() => router.push("/login")} 
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Log In
            </button>
          ) : (
            <div className="relative user-dropdown">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-full hover:bg-emerald-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.name || "Profile"}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="font-semibold text-sm">{user.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">
                    {user.name || "User"} 
                    {isAdmin() && <span className="ml-1 text-xs text-emerald-600">(Admin)</span>}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">{user.email}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden z-50 animate-fadeIn py-1">
                  <Link 
                    href="/account" 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Account
                  </Link>
                  {isAdmin() ? (
                    <Link 
                      href="/admin" 
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Dashboard
                    </Link>
                  ) : (
                  <Link 
                    href="/my-journals" 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    My Journals
                  </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex w-full text-left items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden relative z-50 w-10 h-10 flex items-center justify-center"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <div className="relative flex overflow-hidden items-center justify-center w-8 h-8">
            <div className={`flex flex-col justify-between w-7 h-7 transform transition-all duration-300 ${isOpen ? "rotate-[42deg] translate-y-0" : ""}`}>
              <div className={`bg-gray-800 h-[2px] w-7 transform transition-all duration-300 ${isOpen ? "rotate-90 translate-y-[10px]" : ""}`} />
              <div className={`bg-gray-800 h-[2px] w-7 rounded transform transition-all duration-300 ${isOpen ? "opacity-0 translate-x-10" : ""}`} />
              <div className={`bg-gray-800 h-[2px] w-7 transform transition-all duration-300 ${isOpen ? "-rotate-90 -translate-y-[10px]" : ""}`} />
            </div>
          </div>
        </button>

        {/* Mobile Menu */}
        <div
          className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out flex flex-col ${
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          } lg:hidden`}
        >
          <div className="flex flex-col h-full items-center justify-center space-y-8 p-8">
            {/* User info at top if logged in */}
            {user && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-3 bg-emerald-50 p-2 rounded-lg">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.name || "Profile"}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-semibold text-sm">{user.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {user.name || "User"}
                      {isAdmin() && <span className="ml-1 text-xs text-emerald-600">(Admin)</span>}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-center space-y-6">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-2xl font-medium transition-colors relative
                    ${isLinkActive(link.href) 
                      ? "text-emerald-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:mx-auto after:w-1/2 after:h-0.5 after:bg-emerald-500" 
                      : "text-gray-800 hover:text-emerald-600"
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {!user ? (
              <button 
                className="mt-8 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-10 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/login");
                }}
              >
                Log In
              </button>
            ) : (
              <div className="flex flex-col w-full space-y-2 mt-4">
                <Link 
                  href="/account" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-emerald-50 text-gray-800 hover:bg-emerald-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Account
                </Link>
                {isAdmin() ? (
                  <Link 
                    href="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-emerald-50 text-gray-800 hover:bg-emerald-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Dashboard
                  </Link>
                ) : (
                <Link 
                  href="/my-journals" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-emerald-50 text-gray-800 hover:bg-emerald-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  My Journals
                </Link>
                )}
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
} 