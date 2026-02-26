'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

interface HeaderProps {
  onDonateClick?: () => void;
  onContactClick?: () => void;
  startAtBottom?: boolean;
}

export default function Header({ onDonateClick, onContactClick, startAtBottom = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(!startAtBottom);
  const { user, userProfile, logout } = useAuth();
  const { getTotalItems } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartItemCount = getTotalItems();

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDonateClick) {
      onDonateClick();
    } else {
      // Fallback to hash navigation if no handler provided
      window.location.href = '#donate';
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Handle scroll to switch header position from bottom to top (only on landing page)
  useEffect(() => {
    if (!startAtBottom) return; // Skip scroll handling if header should always be at top

    const handleScroll = () => {
      // Switch to top position after scrolling 100px
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [startAtBottom]);

  return (
    <header 
      className={`fixed left-0 right-0 z-50 border-b border-slate-800 bg-black backdrop-blur-sm transition-all duration-500 ${
        isScrolled
          ? 'safe-top md:top-0 bottom-auto animate-slide-down'
          : 'safe-top bottom-auto md:bottom-0 md:top-auto'
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 transition-all duration-500 ${
        isScrolled ? 'py-2' : 'py-4 sm:py-5'
      }`}>
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/images/logo.png" 
            alt="DCP Logo" 
            className="h-11 w-11 rounded-md object-contain sm:h-12 sm:w-12"
          />
          <div className="leading-tight hidden sm:block">
            <p className="text-xs font-bold text-white">Defend the Constitution</p>
            <p className="text-[10px] text-slate-400">Our Constitution. Our Future</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-4 md:flex lg:gap-6">
          <Link href="/about" className="text-xs font-medium text-slate-300 hover:text-white transition-colors sm:text-sm">About</Link>
          <Link href="/petitions" className="text-xs font-medium text-slate-300 hover:text-white transition-colors sm:text-sm">Petitions</Link>
          <Link href="/news" className="text-xs font-medium text-slate-300 hover:text-white transition-colors sm:text-sm">Articles</Link>
          <Link href="/videos" className="text-xs font-medium text-slate-300 hover:text-white transition-colors sm:text-sm">Videos</Link>
          <Link href="/shop" className="text-xs font-medium text-slate-300 hover:text-white transition-colors sm:text-sm">Shop</Link>
          <Link href="/membership-application" className="rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-bold text-slate-900 hover:bg-yellow-400 transition-colors sm:text-sm">Join DCP</Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (onContactClick) {
                onContactClick();
              } else {
                window.location.href = '/#contact';
              }
            }}
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors sm:text-sm"
          >
            Contact
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative rounded-md p-1.5 text-white hover:bg-slate-800 transition-colors"
            aria-label="Shopping cart"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors sm:px-4 sm:py-2 sm:text-sm md:flex"
                >
                  <span>{userProfile?.name || user.email?.split('@')[0] || 'Account'}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-black shadow-lg">
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/membership"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        Membership
                      </Link>
                      <hr className="my-1 border-slate-800" />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleDonateClick}
                className="inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-slate-100 transition-colors sm:px-4 sm:py-2 sm:text-sm"
              >
                Donate
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors sm:px-4 sm:py-2 sm:text-sm md:inline-flex"
              >
                Sign In
              </Link>
              <button
                onClick={handleDonateClick}
                className="inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-slate-100 transition-colors sm:px-4 sm:py-2 sm:text-sm"
              >
                Donate
              </button>
            </>
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-2 inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-slate-800 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 bg-black md:hidden">
          <nav className="flex flex-col space-y-1 px-4 py-4">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/petitions"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Petitions
            </Link>
            <Link
              href="/news"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Articles
            </Link>
            <Link
              href="/videos"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Videos
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/membership-application"
              onClick={() => setMobileMenuOpen(false)}
              className="mx-4 mt-2 rounded-full bg-yellow-500 px-4 py-3 text-center text-sm font-bold text-slate-900 hover:bg-yellow-400 transition-colors"
            >
              Join DCP
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onContactClick) {
                  onContactClick();
                } else {
                  window.location.href = '/#contact';
                }
              }}
              className="rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Contact
            </button>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

