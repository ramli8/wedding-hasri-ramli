'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Heart, ScanQrCode, Users, CalendarCheck,
  UserCheck, Menu, X, Gift, MapPin, Clock,
} from 'lucide-react'
import { Button } from '@/src/presentation/components/ui/button'
import { useDemoRoute } from '@/src/lib/demo/use-demo-route'

// ─── Decorative ring illustration ──────────────────────
function RingIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Outer ring */}
      <circle cx="200" cy="200" r="160" stroke="#cc785c" strokeWidth="1.5" opacity="0.4" />
      <circle cx="200" cy="200" r="140" stroke="#cc785c" strokeWidth="0.5" opacity="0.2" />
      {/* Inner rings */}
      <circle cx="200" cy="200" r="90" stroke="#141413" strokeWidth="1" opacity="0.15" />
      {/* Decorative dots */}
      <circle cx="200" cy="48" r="3" fill="#cc785c" opacity="0.6" />
      <circle cx="200" cy="352" r="3" fill="#cc785c" opacity="0.6" />
      <circle cx="48" cy="200" r="3" fill="#141413" opacity="0.3" />
      <circle cx="352" cy="200" r="3" fill="#141413" opacity="0.3" />
      {/* Small decorative lines */}
      <line x1="200" y1="40" x2="200" y2="56" stroke="#cc785c" strokeWidth="1" opacity="0.4" />
      <line x1="200" y1="344" x2="200" y2="360" stroke="#cc785c" strokeWidth="1" opacity="0.4" />
      <line x1="40" y1="200" x2="56" y2="200" stroke="#141413" strokeWidth="1" opacity="0.3" />
      <line x1="344" y1="200" x2="360" y2="200" stroke="#141413" strokeWidth="1" opacity="0.3" />
      {/* Center hearts */}
      <path d="M200 180C190 168 175 168 175 180C175 192 200 210 200 210C200 210 225 192 225 180C225 168 210 168 200 180Z" fill="#cc785c" opacity="0.5" />
      <path d="M200 188C194 180 185 180 185 188C185 196 200 207 200 207C200 207 215 196 215 188C215 180 206 180 200 188Z" fill="#cc785c" opacity="0.3" />
    </svg>
  )
}

// ─── Decorative divider ─────────────────────────────────
function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <span className="block h-px w-12 bg-[#cc785c]/30" />
      <span className="block h-1.5 w-1.5 rounded-full bg-[#cc785c]/50" />
      <span className="block h-px w-12 bg-[#cc785c]/30" />
    </div>
  )
}

// ─── Navbar ─────────────────────────────────────────────
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { getRoute } = useDemoRoute()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Story', href: '#story' },
    { label: 'Features', href: '#features' },
    { label: 'Dashboard', href: '#dashboard' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#faf9f5] transition-shadow duration-300"
      style={scrolled ? { boxShadow: '0 1px 3px rgba(20,20,19,0.08)' } : undefined}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cc785c]">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium text-sm text-[#141413]" style={{ fontFamily: 'var(--font-inter)' }}>
            Hasri <span className="text-[#cc785c]">&amp;</span> Ramli
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-[#6c6a64] hover:text-[#141413] transition-colors rounded-md"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href={getRoute('/auth/login')}>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium text-[#141413] hover:text-[#cc785c]"
            >
              Sign In
            </Button>
          </Link>
          <Link href={getRoute('/auth/register')}>
            <button
              className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: '#cc785c',
                fontFamily: 'var(--font-inter)',
                height: 40,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a9583e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#cc785c'}
            >
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f0e8] text-[#141413]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e6dfd8] bg-[#faf9f5]">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-[#6c6a64] hover:text-[#141413] rounded-md transition-colors"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2 border-t border-[#e6dfd8] mt-2">
              <Link href={getRoute('/auth/login')}>
                <Button variant="outline" className="w-full" size="sm">Sign In</Button>
              </Link>
              <Link href={getRoute('/auth/register')}>
                <Button className="w-full" size="sm" style={{ backgroundColor: '#cc785c', color: 'white' }}>
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ───────────────────────────────────────────────
function HeroSection() {
  const { getRoute } = useDemoRoute()
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#faf9f5]">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd8] bg-[#efe9de] px-4 py-1.5 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span className="text-xs font-medium text-[#6c6a64] tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
                Wedding Management System
              </span>
            </div>

            <h1
              className="text-[40px] md:text-[56px] lg:text-[64px] leading-[1.05] tracking-[-1.5px] font-normal text-[#141413] mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Hasri <span className="text-[#cc785c]">&amp;</span> Ramli
            </h1>

            <p
              className="text-lg md:text-xl text-[#3d3d3a] max-w-lg mb-4 leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              We invite you to celebrate our special day.
            </p>

            <div className="flex items-center gap-2 text-[#6c6a64] mb-8">
              <CalendarCheck className="h-4 w-4 text-[#cc785c]" />
              <span className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>December 25, 2026</span>
            </div>

            <Divider />

            <p
              className="text-base text-[#6c6a64] mb-8 leading-relaxed max-w-md"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              A modern wedding management platform — manage guest lists, track RSVPs, 
              handle check-ins, and create unforgettable moments.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={getRoute('/auth/register')}>
                <button
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white transition-colors"
                  style={{
                    backgroundColor: '#cc785c',
                    fontFamily: 'var(--font-inter)',
                    height: 44,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a9583e'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#cc785c'}
                >
                  Access Platform
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
              <a href="#story">
                <button
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-[#141413] transition-colors border border-[#e6dfd8]"
                  style={{
                    backgroundColor: '#faf9f5',
                    fontFamily: 'var(--font-inter)',
                    height: 44,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f0e8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#faf9f5'}
                >
                  Learn More
                </button>
              </a>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[400px] aspect-square">
              <RingIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Story Section ──────────────────────────────────────
function StorySection() {
  return (
    <section id="story" className="py-24 md:py-32 bg-[#faf9f5]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd8] bg-[#efe9de] px-4 py-1.5 mb-6">
          <span className="text-xs font-medium text-[#6c6a64] tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
            Our Story
          </span>
        </div>

        <h2
          className="text-[36px] md:text-[44px] leading-[1.1] tracking-[-1px] font-normal text-[#141413] mb-8"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          The Beginning of Forever
        </h2>

        <Divider />

        <p
          className="text-base md:text-lg text-[#3d3d3a] leading-relaxed mb-6"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Two souls, one journey. We are delighted to welcome you to our wedding management platform — 
          built with love to help us celebrate this beautiful chapter with our closest friends and family.
        </p>

        <p
          className="text-base md:text-lg text-[#6c6a64] leading-relaxed"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          From guest invitations to the final toast, every detail matters. This platform helps us 
          manage it all so we can focus on what truly matters — celebrating together.
        </p>

        {/* Event details */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          <div className="rounded-lg border border-[#e6dfd8] bg-[#f5f0e8] p-6">
            <MapPin className="h-5 w-5 text-[#cc785c] mb-3 mx-auto" />
            <h3 className="text-sm font-medium text-[#141413] mb-1" style={{ fontFamily: 'var(--font-inter)' }}>Ceremony</h3>
            <p className="text-xs text-[#6c6a64]" style={{ fontFamily: 'var(--font-inter)' }}>Grand Hall, Jakarta</p>
          </div>
          <div className="rounded-lg border border-[#e6dfd8] bg-[#f5f0e8] p-6">
            <Clock className="h-5 w-5 text-[#cc785c] mb-3 mx-auto" />
            <h3 className="text-sm font-medium text-[#141413] mb-1" style={{ fontFamily: 'var(--font-inter)' }}>Time</h3>
            <p className="text-xs text-[#6c6a64]" style={{ fontFamily: 'var(--font-inter)' }}>10:00 AM — 4:00 PM</p>
          </div>
          <div className="rounded-lg border border-[#e6dfd8] bg-[#f5f0e8] p-6">
            <Gift className="h-5 w-5 text-[#cc785c] mb-3 mx-auto" />
            <h3 className="text-sm font-medium text-[#141413] mb-1" style={{ fontFamily: 'var(--font-inter)' }}>Reception</h3>
            <p className="text-xs text-[#6c6a64]" style={{ fontFamily: 'var(--font-inter)' }}>Ballroom, 2nd Floor</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ───────────────────────────────────────────
const features = [
  {
    icon: Users,
    title: 'Guest Management',
    description: 'Easily manage your guest list with categories, tracking, and detailed profiles — all in one place.',
    tags: ['Categories', 'Profiles', 'Tracking'],
  },
  {
    icon: ScanQrCode,
    title: 'QR Check-In',
    description: 'Seamless check-in experience with QR codes. Scan and verify guests in seconds at the venue.',
    tags: ['QR Code', 'Real-time', 'Verification'],
  },
  {
    icon: UserCheck,
    title: 'RSVP Tracking',
    description: 'Track who&apos;s attending, who&apos;s declined, and who&apos;s yet to respond — live status updates.',
    tags: ['Attendance', 'Status', 'Reports'],
  },
  {
    icon: CalendarCheck,
    title: 'Event Timeline',
    description: 'Keep track of your wedding timeline with scheduled reminders and event milestones.',
    tags: ['Schedule', 'Reminders', 'Planning'],
  },
  {
    icon: Gift,
    title: 'Gift Registry',
    description: 'Manage wish lists and track gifts received, with easy sharing for guests.',
    tags: ['Wish List', 'Tracking', 'Sharing'],
  },
  {
    icon: Heart,
    title: 'Guest Experience',
    description: 'Beautiful invitation pages, photo galleries, and a personalized experience for every guest.',
    tags: ['Invitations', 'Gallery', 'Personalized'],
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#faf9f5]">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd8] bg-[#efe9de] px-4 py-1.5 mb-6">
            <span className="text-xs font-medium text-[#6c6a64] tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
              Features
            </span>
          </div>
          <h2
            className="text-[32px] md:text-[40px] leading-[1.1] tracking-[-1px] font-normal text-[#141413] mb-4"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Everything you need for your big day
          </h2>
          <p
            className="text-base md:text-lg text-[#3d3d3a] leading-relaxed"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            From invitations to check-ins, manage your wedding with ease.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl p-8 transition-all duration-300"
              style={{
                backgroundColor: '#efe9de',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8e0d2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#efe9de'}
            >
              <div
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg mb-5"
                style={{ backgroundColor: 'rgba(204, 120, 92, 0.15)' }}
              >
                <feature.icon className="h-5 w-5" style={{ color: '#cc785c' }} />
              </div>
              <h3
                className="text-lg font-medium mb-2 text-[#141413]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm text-[#6c6a64] leading-relaxed mb-5"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {feature.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: '#f5f0e8',
                      color: '#6c6a64',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Dashboard Preview (dark product mockup) ────────────
function DashboardSection() {
  const { getRoute } = useDemoRoute()
  return (
    <section id="dashboard" className="py-24 md:py-32 bg-[#faf9f5]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd8] bg-[#efe9de] px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-[#6c6a64] tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
                Dashboard
              </span>
            </div>
            <h2
              className="text-[32px] md:text-[40px] leading-[1.1] tracking-[-1px] font-normal text-[#141413] mb-6"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Elegant control,<br />simply managed
            </h2>
            <p
              className="text-base text-[#3d3d3a] leading-relaxed mb-6"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              A clean, intuitive dashboard puts everything at your fingertips. 
              Manage guests, track attendance, and monitor your wedding data — all from one place.
            </p>
            <Link href={getRoute('/admin')}>
              <button
                className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors"
                style={{
                  backgroundColor: '#cc785c',
                  fontFamily: 'var(--font-inter)',
                  height: 40,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a9583e'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#cc785c'}
              >
                View Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Right: Dark mockup card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#181715',
            }}
          >
            {/* Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: '#252320' }}>
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#c64545' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#d4a017' }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#5db872' }} />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs font-medium" style={{ color: '#a09d96', fontFamily: 'var(--font-inter)' }}>
                  wedding-dashboard
                </span>
              </div>
            </div>

            {/* Mockup Content */}
            <div className="p-6 space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Guests', value: '248', color: '#cc785c' },
                  { label: 'Attending', value: '186', color: '#5db872' },
                  { label: 'Pending', value: '42', color: '#e8a55a' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg p-3" style={{ backgroundColor: '#1f1e1b' }}>
                    <div className="text-xs font-medium mb-1" style={{ color: '#a09d96', fontFamily: 'var(--font-inter)' }}>
                      {stat.label}
                    </div>
                    <div className="text-xl font-medium" style={{ color: '#faf9f5', fontFamily: 'var(--font-cormorant)' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table header */}
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: '#252320' }}>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#a09d96', fontFamily: 'var(--font-inter)' }}>
                  Recent RSVPs
                </span>
              </div>

              {/* Table rows */}
              {[
                { name: 'Sarah Johnson', status: 'Attending', statusColor: '#5db872' },
                { name: 'Michael Chen', status: 'Pending', statusColor: '#e8a55a' },
                { name: 'Emily Davis', status: 'Declined', statusColor: '#c64545' },
                { name: 'James Wilson', status: 'Attending', statusColor: '#5db872' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm" style={{ color: '#faf9f5', fontFamily: 'var(--font-inter)' }}>
                    {row.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: row.statusColor }} />
                    <span className="text-xs" style={{ color: '#a09d96', fontFamily: 'var(--font-inter)' }}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Coral Band ─────────────────────────────────────
function CtaSection() {
  const { getRoute } = useDemoRoute()
  return (
    <section className="py-24 md:py-32 bg-[#faf9f5]">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="relative rounded-xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center"
          style={{ backgroundColor: '#cc785c' }}
        >
          <h2
            className="text-[28px] md:text-[36px] leading-[1.2] tracking-[-0.5px] font-normal text-white mb-4"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Ready to begin your journey?
          </h2>
          <p
            className="text-base text-white/80 max-w-lg mx-auto mb-8 leading-relaxed"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Create your account and start managing your wedding guest experience today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={getRoute('/auth/register')}>
              <button
                className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#faf9f5',
                  color: '#141413',
                  fontFamily: 'var(--font-inter)',
                  height: 44,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f0e8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf9f5'
                }}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
            <Link href={getRoute('/auth/login')}>
              <button
                className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-inter)',
                  height: 44,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              >
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ─────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer
      className="py-16"
      style={{ backgroundColor: '#181715', color: '#a09d96' }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cc785c]">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[#faf9f5]" style={{ fontFamily: 'var(--font-inter)' }}>
                Hasri &amp; Ramli
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
              A modern wedding management platform for your special day.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#faf9f5] mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Platform
            </h4>
            <ul className="space-y-2.5">
              {['Features', 'Dashboard', 'RSVP', 'Check-In'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm hover:text-[#faf9f5] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#faf9f5] mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {['About', 'Privacy', 'Terms'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm hover:text-[#faf9f5] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#faf9f5] mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Contact
            </h4>
            <ul className="space-y-2.5">
              {['Help', 'Support', 'Feedback'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm hover:text-[#faf9f5] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: '#252320' }}>
          <p className="text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
            &copy; {new Date().getFullYear()} Hasri &amp; Ramli. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
            <span>Built with love</span>
            <Heart className="h-3 w-3 text-[#cc785c]" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Landing Page ───────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <LandingNavbar />
      <main>
        <HeroSection />
        <StorySection />
        <FeaturesSection />
        <DashboardSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
