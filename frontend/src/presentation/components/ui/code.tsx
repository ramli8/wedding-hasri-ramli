import { useState } from "react"
import {
    Copy, Check, Terminal
} from 'lucide-react'

function highlightCode(code: string, lang: string): React.ReactNode[] {
    const lines = code.split('\n')
    return lines.map((line, i) => {
        let highlighted: React.ReactNode

        if (lang === 'bash') {
            highlighted = highlightBash(line)
        } else if (lang === 'go') {
            highlighted = highlightGo(line)
        } else if (lang === 'tsx' || lang === 'ts') {
            highlighted = highlightTsx(line)
        } else if (lang === 'json') {
            highlighted = highlightJson(line)
        } else if (lang === 'yaml') {
            highlighted = highlightYaml(line)
        } else if (lang === 'env') {
            highlighted = highlightEnv(line)
        } else {
            highlighted = line
        }

        return (
            <div key={i}>{highlighted || '\u200B'}</div>
        )
    })
}

function highlightBash(line: string): React.ReactNode {
    if (line.trimStart().startsWith('#')) return <span className="text-muted-foreground/60">{line}</span>
    const parts: React.ReactNode[] = []
    const regex = /((?:make|cd|go|git|cp|docker|bun|npm|npx)\s)|("[^"]*"|'[^']*')|(--?\w[\w-]*)|(\$\([^)]*\)|\$\{[^}]*\})/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index))
        if (match[1]) parts.push(<span key={match.index} className="text-emerald-400">{match[1]}</span>)
        else if (match[2]) parts.push(<span key={match.index} className="text-amber-400">{match[2]}</span>)
        else if (match[3]) parts.push(<span key={match.index} className="text-blue-400">{match[3]}</span>)
        else if (match[4]) parts.push(<span key={match.index} className="text-cyan-400">{match[4]}</span>)
        last = match.index + match[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return <>{parts}</>
}

function highlightGo(line: string): React.ReactNode {
    if (line.trimStart().startsWith('//')) return <span className="text-muted-foreground/60">{line}</span>
    const parts: React.ReactNode[] = []
    const regex = /\b(package|import|func|return|if|else|for|range|var|const|type|struct|interface|map|chan|go|defer|nil|err|error)\b|("[^"]*")|(\b\d+\b)|(\b[A-Z]\w+\b)/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index))
        if (match[1]) parts.push(<span key={match.index} className="text-purple-400">{match[1]}</span>)
        else if (match[2]) parts.push(<span key={match.index} className="text-amber-400">{match[2]}</span>)
        else if (match[3]) parts.push(<span key={match.index} className="text-cyan-400">{match[3]}</span>)
        else if (match[4]) parts.push(<span key={match.index} className="text-blue-400">{match[4]}</span>)
        last = match.index + match[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return <>{parts}</>
}

function highlightTsx(line: string): React.ReactNode {
    if (line.trimStart().startsWith('//')) return <span className="text-muted-foreground/60">{line}</span>
    const parts: React.ReactNode[] = []
    const regex = /\b(import|export|from|const|let|function|return|async|await|interface|type|default)\b|('[^']*'|"[^"]*"|`[^`]*`)|(\b\d+\b)|(<\/?[A-Z]\w*|<\/?[a-z][\w-]*)/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index))
        if (match[1]) parts.push(<span key={match.index} className="text-purple-400">{match[1]}</span>)
        else if (match[2]) parts.push(<span key={match.index} className="text-amber-400">{match[2]}</span>)
        else if (match[3]) parts.push(<span key={match.index} className="text-cyan-400">{match[3]}</span>)
        else if (match[4]) parts.push(<span key={match.index} className="text-emerald-400">{match[4]}</span>)
        last = match.index + match[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return <>{parts}</>
}

function highlightJson(line: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const regex = /("[^"]*")\s*(:)|("[^"]*")/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index))
        if (match[1]) {
            parts.push(<span key={match.index} className="text-blue-400">{match[1]}</span>)
            parts.push(<span key={match.index + 1} className="text-foreground">:</span>)
        } else if (match[3]) parts.push(<span key={match.index} className="text-amber-400">{match[3]}</span>)
        last = match.index + match[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return <>{parts}</>
}

function highlightYaml(line: string): React.ReactNode {
    if (line.trimStart().startsWith('#')) return <span className="text-muted-foreground/60">{line}</span>
    const parts: React.ReactNode[] = []
    const regex = /([\w.-]+)(:)|(\$\{[^}]+\})|("[^"]*"|'[^']*')/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
        if (match.index > last) parts.push(line.slice(last, match.index))
        if (match[1]) {
            parts.push(<span key={match.index} className="text-blue-400">{match[1]}</span>)
            parts.push(<span key={match.index + 1} className="text-foreground">:</span>)
        } else if (match[3]) parts.push(<span key={match.index} className="text-cyan-400">{match[3]}</span>)
        else if (match[4]) parts.push(<span key={match.index} className="text-amber-400">{match[4]}</span>)
        last = match.index + match[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return <>{parts}</>
}

function highlightEnv(line: string): React.ReactNode {
    if (line.trimStart().startsWith('#')) return <span className="text-muted-foreground/60">{line}</span>
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) return line
    return (
        <>
            <span className="text-blue-400">{line.slice(0, eqIdx)}</span>
            <span className="text-foreground">=</span>
            <span className="text-amber-400">{line.slice(eqIdx + 1)}</span>
        </>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button onClick={copy} className="absolute top-10 right-3 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
    return (
        <div className="relative rounded-lg border border-border/50 bg-muted/30 overflow-hidden my-4">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/20">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">{lang}</span>
            </div>
            <CopyButton text={code} />
            <pre className="p-4 text-sm overflow-x-auto"><code>{highlightCode(code, lang)}</code></pre>
        </div>
    )
}

export default CodeBlock;