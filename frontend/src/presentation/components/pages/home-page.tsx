'use client'

import Link from 'next/link'
import {
    ArrowRight, Shield, Users, ShieldCheck, Key
} from 'lucide-react'
import { Separator } from '@/src/presentation/components/ui/separator'

interface FeatureCard {
    title: string
    description: string
    href: string
    icon: React.ElementType
}

export function HomePage() {
    const managementFeatures: FeatureCard[] = [
        {
            title: 'Users',
            description: 'View and manage user accounts, activate or deactivate users, and assign roles.',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Roles',
            description: 'Create and manage roles with specific permissions for access control.',
            href: '/admin/roles',
            icon: ShieldCheck,
        },
        {
            title: 'Permissions',
            description: 'Define and manage granular permissions for each module and action.',
            href: '/admin/permissions',
            icon: Key,
        },
    ]

    return (
        <div className="space-y-12 pb-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 pt-8">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    Welcome to <span className="text-foreground">GNS</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                    Your base project powered by Go, Next.js, and shadcn — with authentication, role management, and more built in.
                </p>
            </div>

            <Separator />

            {/* User Management Section */}
            <section className="space-y-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">User Management</h2>
                    </div>
                    <p className="text-muted-foreground">Manage users, roles, and permissions for your application</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managementFeatures.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <Link
                                key={feature.href}
                                href={feature.href}
                                className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all duration-200 hover:border-foreground hover:shadow-md"
                            >
                                <div className="absolute inset-0 bg-foreground/0 transition-all duration-200 group-hover:bg-foreground/5" />

                                <div className="relative space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/20 bg-background transition-all duration-200 group-hover:border-foreground group-hover:bg-foreground">
                                            <Icon className="h-5 w-5 text-foreground transition-colors duration-200 group-hover:text-background" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
