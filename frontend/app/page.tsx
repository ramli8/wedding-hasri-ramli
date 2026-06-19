import { Button } from "@/src/presentation/components/ui/button"
import { DisplayXL, DisplayLG, TitleMD, BodyMD, CodeText, CaptionUppercase } from "@/src/presentation/components/ui/typography"
import { HeroBand, FeatureCard, ProductMockupCardDark, CalloutCardCoral, CodeWindowCard } from "@/src/presentation/components/ui/cards"
import { Terminal, Sparkles, BookOpen, ChevronRight, Lock } from "lucide-react"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* Top Nav (simplified for showcase) */}
      <nav className="h-16 flex items-center justify-between px-6 sm:px-12 border-b border-border/50">
        <div className="flex items-center gap-2">
          {/* Spike mark substitute */}
          <div className="text-xl">✶</div>
          <span className="font-sans font-medium">Claude Design</span>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Product</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Research</a>
          <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Company</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="link" className="hidden sm:inline-flex text-ink">Sign in</Button>
          <Button>Try Demo</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroBand>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col gap-8 max-w-xl">
            <div className="flex flex-col gap-6">
              <DisplayXL>
                Meet your new design system
              </DisplayXL>
              <BodyMD className="text-body-strong">
                The warmest, most editorial interface in the AI-product category. 
                Built on a tinted cream canvas with slab-serif display typography and warm coral accents.
              </BodyMD>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg">Explore Components</Button>
              <Button size="lg" variant="secondary">Read Documentation</Button>
            </div>
          </div>
          
          <div className="relative">
            <ProductMockupCardDark className="shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Terminal className="w-5 h-5 text-accent-teal" />
                <CaptionUppercase className="text-on-dark-soft">System Initialized</CaptionUppercase>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded bg-surface-dark-soft/50 border border-border/10">
                  <CodeText className="text-on-dark block">
                    <span className="text-primary">import</span> &#123; DisplayXL &#125; <span className="text-primary">from</span> &quot;typography&quot;
                  </CodeText>
                  <CodeText className="text-muted-foreground mt-2 block">
                    {/* The system anchors on a tinted cream canvas */}
                  </CodeText>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm text-on-dark-soft font-medium">Ready for deployment</span>
                </div>
              </div>
            </ProductMockupCardDark>
          </div>
        </div>
      </HeroBand>

      {/* Features Section */}
      <section className="py-section px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
        <DisplayLG className="text-center mb-16">
          Editorial by default
        </DisplayLG>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard>
            <Sparkles className="w-8 h-8 text-primary mb-6" />
            <TitleMD className="mb-4">Warm Canvas</TitleMD>
            <BodyMD className="text-muted-foreground">
              Distinctly warm, deliberately not the cool gray-white that every other brand uses.
              The cream-to-dark contrast is the page&apos;s pacing rhythm.
            </BodyMD>
          </FeatureCard>

          <FeatureCard>
            <BookOpen className="w-8 h-8 text-primary mb-6" />
            <TitleMD className="mb-4">Literary Voice</TitleMD>
            <BodyMD className="text-muted-foreground">
              Slab-serif display headlines paired with humanist sans body creates a literary publication feel, not a SaaS marketing page.
            </BodyMD>
          </FeatureCard>

          <FeatureCard>
            <Lock className="w-8 h-8 text-primary mb-6" />
            <TitleMD className="mb-4">Navy Product Surfaces</TitleMD>
            <BodyMD className="text-muted-foreground">
              Dark surfaces are where we show product chrome — code blocks, terminal output, and agentic-flow diagrams.
            </BodyMD>
          </FeatureCard>
        </div>
      </section>

      {/* Code Window / Developer Section */}
      <section className="py-section bg-surface-soft">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <DisplayLG className="mb-6">Built for developers</DisplayLG>
              <BodyMD className="text-body-strong mb-8">
                The dark navy product mockups carry code blocks, terminal panels, and model comparison data — showing the product chrome at scale rather than abstract marketing illustrations.
              </BodyMD>
              <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary text-primary">
                View API Reference <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <CodeWindowCard className="shadow-xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-dark-elevated border-b border-border/10">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <CodeText className="ml-4 text-xs text-on-dark-soft">index.tsx</CodeText>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm">
                  <CodeText className="text-on-dark leading-loose">
                    <span className="text-primary">const</span> App = () =&gt; &#123;<br/>
                    &nbsp;&nbsp;<span className="text-primary">return</span> (<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-accent-teal">CalloutCardCoral</span>&gt;<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-accent-teal">TitleMD</span>&gt;Ready to begin?&lt;/<span className="text-accent-teal">TitleMD</span>&gt;<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-accent-teal">CalloutCardCoral</span>&gt;<br/>
                    &nbsp;&nbsp;)<br/>
                    &#125;
                  </CodeText>
                </pre>
              </div>
            </CodeWindowCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-section px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
        <CalloutCardCoral className="flex flex-col items-center text-center">
          <DisplayLG className="mb-6 max-w-2xl">
            Start building with the new design system
          </DisplayLG>
          <BodyMD className="mb-10 text-primary-foreground/90 max-w-xl">
            A deliberate counter-positioning against the cool slate and saturated blue of the rest of the industry.
          </BodyMD>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90 h-12 px-8">
            Get Started Now
          </Button>
        </CalloutCardCoral>
      </section>
      
      {/* Footer */}
      <footer className="bg-surface-dark text-on-dark-soft py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="text-xl text-on-dark">✶</div>
              <span className="font-sans font-medium text-on-dark">Claude Design</span>
            </div>
            <p className="text-sm text-on-dark-soft">
              The warmest, most editorial interface in the AI-product category.
            </p>
          </div>
          
          <div>
            <h4 className="text-on-dark font-medium mb-4 text-sm">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-on-dark transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-on-dark transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-on-dark transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-on-dark font-medium mb-4 text-sm">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-on-dark transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-on-dark transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-on-dark transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  )
}
