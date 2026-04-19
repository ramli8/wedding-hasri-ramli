'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ArrowRight,
    Shield,
    Globe,
    Palette,
    FileCheck,
    Plug,
    Users,
    Menu,
    X,
    Github,
    Terminal,
    Code2,
} from 'lucide-react'
import { ThemeToggle } from '@/src/presentation/components/theme-toggle'
import { Button } from '@/src/presentation/components/ui/button'
import { useDemoRoute } from '@/src/lib/demo/use-demo-route'
import { GoIcon, NextjsIcon, ShadcnIcon } from '../ui/icons/icon'

// ─── Navbar ──────────────────────────────────────────────
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
        { label: 'Features', href: '#features' },
        { label: 'Stack', href: '#stack' },
        { label: 'Architecture', href: '#architecture' },
        { label: 'Docs', href: getRoute('/docs') },
    ]

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/gns.png" alt="GNS" className="h-8 w-8 rounded-lg dark:invert" />
                    <span className="text-lg font-semibold tracking-tight">GNS</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2">
                    <ThemeToggle />
                    <Link href={getRoute("/auth/login")}>
                        <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link href={getRoute("/auth/register")}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile */}
                <div className="flex md:hidden items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
                    <div className="px-6 py-4 space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-3 flex flex-col gap-2 border-t border-border/50 mt-2">
                            <Link href={getRoute("/auth/login")}>
                                <Button variant="outline" className="w-full" size="sm">Sign In</Button>
                            </Link>
                            <Link href={getRoute("/auth/register")}>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
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

// ─── Hero ────────────────────────────────────────────────
function HeroSection() {
    const { getRoute } = useDemoRoute()
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-teal-500/6 rounded-full blur-[100px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6">
                <div className="max-w-3xl">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground mb-8">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Open Source Base Project
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
                        Build faster with{' '}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-400">
                            Go, Next.js
                        </span>
                        {' '}and{' '}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-cyan-400">
                            shadcn
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                        A production-ready starter kit with authentication, role management,
                        i18n, and a clean architecture — so you can focus on building what matters.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href={getRoute("/auth/register")}>
                            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white! h-12 px-8 text-base">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="https://github.com/yogameleniawan/gns.git" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                <Github className="mr-2 h-4 w-4" />
                                View on GitHub
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Code Preview Card */}
                <div className="mt-16 md:mt-20">
                    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-emerald-500/5">
                        {/* Window Chrome */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                            <div className="flex gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="flex items-center gap-1 rounded-md bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                                    <Terminal className="h-3 w-3" />
                                    <span>main.go</span>
                                </div>
                            </div>
                        </div>
                        {/* Code Content */}
                        <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                            <div className="text-muted-foreground/60">{`// cmd/api/main.go`}</div>
                            <div className="mt-2">
                                <span className="text-purple-400">package</span>{' '}
                                <span className="text-foreground">main</span>
                            </div>
                            <div className="mt-4">
                                <span className="text-purple-400">func</span>{' '}
                                <span className="text-blue-400">main</span>
                                <span className="text-foreground">() {'{'}</span>
                            </div>
                            <div className="ml-6">
                                <span className="text-foreground">godotenv.</span>
                                <span className="text-blue-400">Load</span>
                                <span className="text-foreground">()</span>
                            </div>
                            <div className="mt-3 ml-6">
                                <span className="text-muted-foreground/60">{`// setup server`}</span>
                            </div>
                            <div className="ml-6">
                                <span className="text-foreground">container, _</span>
                                <span className="text-muted-foreground"> := </span>
                                <span className="text-foreground">containerPkg.</span>
                                <span className="text-blue-400">New</span>
                                <span className="text-foreground">()</span>
                            </div>
                            <div className="ml-6">
                                <span className="text-foreground">container.</span>
                                <span className="text-blue-400">Invoke</span>
                                <span className="text-foreground">(Start)</span>
                            </div>
                            <div className="mt-3 ml-6">
                                <span className="text-muted-foreground/60">{`// add quit signal`}</span>
                            </div>
                            <div className="ml-6">
                                <span className="text-foreground">quit</span>
                                <span className="text-muted-foreground"> := </span>
                                <span className="text-purple-400">make</span>
                                <span className="text-foreground">(</span>
                                <span className="text-purple-400">chan</span>
                                <span className="text-foreground"> os.Signal, </span>
                                <span className="text-amber-400">1</span>
                                <span className="text-foreground">)</span>
                            </div>
                            <div className="ml-6">
                                <span className="text-foreground">signal.</span>
                                <span className="text-blue-400">Notify</span>
                                <span className="text-foreground">(quit, os.Interrupt)</span>
                            </div>
                            <div className="ml-6">
                                <span className="text-foreground">container.</span>
                                <span className="text-blue-400">Invoke</span>
                                <span className="text-foreground">(Shutdown)</span>
                            </div>
                            <div className="text-foreground">{'}'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── Tech Stack ──────────────────────────────────────────
const techStack = [
    {
        name: 'Go',
        description: 'High-performance backend with Fiber framework, clean architecture, and built-in concurrency.',
        icon: GoIcon,
        tags: ['Fiber', 'REST API', 'Clean Arch'],
        color: 'from-cyan-500 to-blue-500',
        iconBg: 'bg-cyan-500/10 text-cyan-500',
    },
    {
        name: 'Next.js',
        description: 'React framework with server components, file-based routing, and optimized performance out of the box.',
        icon: NextjsIcon,
        tags: ['React 19', 'App Router', 'SSR'],
        color: 'from-foreground to-foreground/70',
        iconBg: 'bg-foreground/10 text-foreground',
    },
    {
        name: 'shadcn/ui',
        description: 'Beautiful, accessible components built on Radix UI with Tailwind CSS for rapid UI development.',
        icon: ShadcnIcon,
        tags: ['Tailwind v4', 'Radix UI', 'Dark Mode'],
        color: 'from-emerald-500 to-teal-500',
        iconBg: 'bg-emerald-500/10 text-emerald-500',
    },
]

function TechStackSection() {
    return (
        <section id="stack" className="py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-sm font-medium text-emerald-500 tracking-wide uppercase mb-3">Tech Stack</p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Powered by modern tools
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Each technology chosen for performance, developer experience, and production readiness.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {techStack.map((tech) => (
                        <div
                            key={tech.name}
                            className="group relative rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-300 hover:border-border hover:bg-card/60 hover:shadow-lg hover:shadow-black/5"
                        >
                            {/* Icon */}
                            <div className={`inline-flex items-center justify-center h-11 w-11 rounded-lg ${tech.iconBg} mb-5`}>
                                <tech.icon className="h-8 w-8" />
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold mb-2">{tech.name}</h3>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                {tech.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {tech.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-xs px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground"
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

// ─── Features ────────────────────────────────────────────
const features = [
    {
        icon: Shield,
        title: 'Authentication',
        description: 'JWT-based auth with login, register, and token refresh built into the Go backend.',
    },
    {
        icon: Users,
        title: 'Role-Based Access',
        description: 'Granular roles and permissions system with frontend route protection.',
    },
    {
        icon: Globe,
        title: 'Internationalization',
        description: 'Multi-language support via next-intl with English and Indonesian out of the box.',
    },
    {
        icon: Palette,
        title: 'Theme System',
        description: 'Light and dark mode with next-themes, fully integrated with shadcn/ui components.',
    },
    {
        icon: FileCheck,
        title: 'Form Validation',
        description: 'Type-safe forms with react-hook-form and Zod schema validation.',
    },
    {
        icon: Plug,
        title: 'API Integration',
        description: 'Axios + TanStack Query with typed hooks for data fetching and caching.',
    },
]

function FeaturesSection() {
    return (
        <section id="features" className="py-24 md:py-32 relative">
            {/* Subtle background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-sm font-medium text-emerald-500 tracking-wide uppercase mb-3">Features</p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Everything you need, pre-configured
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Stop setting up boilerplate. Start building your product with batteries included.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-xl border border-border/40 bg-card/20 p-6 transition-all duration-300 hover:border-border/70 hover:bg-card/40"
                        >
                            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 mb-4">
                                <feature.icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ─── Architecture ────────────────────────────────────────
function ArchitectureSection() {
    const backendStructure = [
        { name: 'cmd/', label: 'Entry point' },
        { name: 'internal/', label: '' },
        { name: '  domain/', label: 'Entities & interfaces' },
        { name: '  application/', label: 'Use cases & services' },
        { name: '  infrastructure/', label: 'DB, auth, external' },
        { name: '  presentation/', label: 'Controllers & routes' },
        { name: 'pkg/', label: 'Shared utilities' },
    ]

    const frontendStructure = [
        { name: 'app/', label: 'Next.js routes' },
        { name: 'src/', label: '' },
        { name: '  domain/', label: 'Types & interfaces' },
        { name: '  application/', label: 'Hooks & use cases' },
        { name: '  infrastructure/', label: 'API, stores' },
        { name: '  presentation/', label: 'Components & pages' },
        { name: '  lib/', label: 'Utilities' },
    ]

    return (
        <section id="architecture" className="py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-sm font-medium text-emerald-500 tracking-wide uppercase mb-3">Architecture</p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Clean architecture, front to back
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Consistent folder structure on both sides for maintainable, scalable code.
                    </p>
                </div>

                {/* Two Columns */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Backend */}
                    <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 bg-muted/20">
                            <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium ml-2">backend/</span>
                            <div className="ml-auto">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-medium">Go</span>
                            </div>
                        </div>
                        <div className="p-5 font-mono text-sm space-y-1.5">
                            {backendStructure.map((item, i) => (
                                <div key={i} className="flex items-baseline gap-3">
                                    <span className="text-emerald-400/80">{item.name}</span>
                                    {item.label && (
                                        <span className="text-muted-foreground/50 text-xs">{`// `}{item.label}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Frontend */}
                    <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 bg-muted/20">
                            <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium ml-2">frontend/</span>
                            <div className="ml-auto">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">Next.js</span>
                            </div>
                        </div>
                        <div className="p-5 font-mono text-sm space-y-1.5">
                            {frontendStructure.map((item, i) => (
                                <div key={i} className="flex items-baseline gap-3">
                                    <span className="text-teal-400/80">{item.name}</span>
                                    {item.label && (
                                        <span className="text-muted-foreground/50 text-xs">{`// `}{item.label}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── CTA ─────────────────────────────────────────────────
function CtaSection() {
    const { getRoute } = useDemoRoute()
    return (
        <section className="py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="relative rounded-2xl border border-border/50 bg-card/20 overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/6 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    </div>

                    <div className="relative px-8 py-16 md:py-20 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Ready to start building?
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                            Clone the repo, set up your environment, and start shipping features in minutes — not days.
                        </p>

                        {/* Terminal-like command */}
                        <div className="inline-flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-5 py-3 font-mono text-sm mb-8">
                            <span className="text-emerald-500">$</span>
                            <span className="text-muted-foreground">git clone</span>
                            <span className="text-foreground">https://github.com/yogameleniawan/gns.git</span>
                            <button
                                className="text-muted-foreground/50 hover:text-foreground transition-colors ml-1"
                                onClick={() => navigator.clipboard.writeText('git clone https://github.com/yogameleniawan/gns.git')}
                                title="Copy command"
                            >
                                <Code2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href={getRoute("/auth/register")}>
                                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="https://github.com/yogameleniawan/gns.git" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg" className="h-12 px-8">
                                    <Github className="mr-2 h-4 w-4" />
                                    Star on GitHub
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── Footer ──────────────────────────────────────────────
function LandingFooter() {
    return (
        <footer className="border-t border-border/50 py-10">
            <div className="mx-auto max-w-6xl px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/gns.png" alt="GNS" className="h-5 w-5 rounded dark:invert" />
                        <span className="text-sm text-muted-foreground">
                            GNS © {new Date().getFullYear()}
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                    </div>

                    {/* Tech Badges */}
                    <div className="flex items-center gap-2">
                        {['Go', 'Next.js', 'shadcn'].map((tech) => (
                            <span
                                key={tech}
                                className="text-[10px] px-2 py-0.5 rounded bg-muted/50 text-muted-foreground"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}

// ─── Main Landing Page ───────────────────────────────────
export function LandingPage() {
    return (
        <div className="min-h-screen">
            <LandingNavbar />
            <main>
                <HeroSection />
                <TechStackSection />
                <FeaturesSection />
                <ArchitectureSection />
                <CtaSection />
            </main>
            <LandingFooter />
        </div>
    )
}
