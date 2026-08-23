import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Anchor } from 'lucide-react';

export const DesignNotes: React.FC = () => {
  const glassCard = 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5';
  const sectionTitle = 'text-2xl font-bold text-white mb-4';
  const bodyText = 'text-slate-300 leading-relaxed';
  const listItem = 'text-slate-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-ocean-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-slate-400 hover:text-ocean-300 mb-8 transition-colors text-sm group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to App
        </Link>

        <article className="max-w-none">
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-900/60 border border-ocean-700/50 text-ocean-300 text-xs font-semibold tracking-widest uppercase mb-4">
              <Anchor className="w-3 h-3" />
              Haven UI Kit
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-white tracking-tight mb-4">
              Haven — Design Philosophy
            </h1>
            <p className="text-xl text-slate-400 font-light leading-relaxed">
              How a real-world disaster inspired a resilient, human-centered crisis-coordination platform.
            </p>
          </header>

          {/* Section 1 */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>1. Background: Grassroots Tech in Real Emergencies</h2>
            <p className={bodyText}>
              In late 2025, during a major residential fire in Taipo (Hong Kong), thousands of people scrambled for information, safety updates, and help. While official channels were slow, <strong className="text-white">ordinary citizens self-organized</strong> using:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6 mt-4">
              {['Google Forms', 'Google Sheets', 'WhatsApp broadcasts', 'Telegram groups', 'Crowdsourced location notes', 'Volunteers manually verifying each submission'].map(item => (
                <li key={item} className={listItem}>{item}</li>
              ))}
            </ul>
            <p className={bodyText}>
              The tools were fragmented, improvised, and often messy—but they worked far better than expected.
            </p>
            <blockquote className="border-l-4 border-ocean-500 pl-4 italic bg-ocean-900/30 py-3 pr-4 rounded-r-xl my-6 text-ocean-200">
              Because in a crisis, <strong className="text-white">speed beats perfection</strong>.
            </blockquote>
            <p className={bodyText}>
              What stood out was not the sophistication of the tools, but the <strong className="text-white">incredible resilience of low-tech, human-centered systems</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 mb-6">
              {[
                'They required no installation',
                'They worked across all devices',
                'Everyone already knew how to use them',
                'Updates synchronized instantly',
                'Sheets naturally supported collaboration',
                'Volunteers could step in without training',
              ].map(item => (
                <li key={item} className={listItem}>{item}</li>
              ))}
            </ul>
            <p className={bodyText}>
              This grassroots "stack" became the lifeline for hundreds of people.
            </p>
            <p className={`${bodyText} mt-4`}>
              Haven is a tribute to that spirit. It's not trying to replace official emergency platforms. It's trying to <strong className="text-white">amplify what communities are already doing</strong>.
            </p>
          </div>

          {/* Section 2 */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>2. Crisis UX: What People Need When the World is Burning</h2>
            <p className={bodyText}>
              Disaster UX is fundamentally different from normal UX. When people are stressed, scared, or managing chaos, <strong className="text-white">cognitive load skyrockets</strong> and the brain shifts to survival mode. This changes how humans interact with systems:
            </p>
            <div className="grid gap-4 md:grid-cols-2 mt-6">
              {[
                { emoji: '🧨', title: '1. No clutter', desc: 'Crisis users have almost no working memory available. Every extra button, color, or icon becomes noise.' },
                { emoji: '⏱', title: '2. Time-to-action < 5s', desc: "If someone can't create a form immediately, they'll abandon the process entirely." },
                { emoji: '📱', title: '3. Mobile-first', desc: 'Most crisis communication happens on phones — on stairs, in streets, in shelters.' },
                { emoji: '🔊', title: '4. Broadcast-friendly', desc: 'Links will be shared through WhatsApp groups, voice notes, and screenshot chains.' },
                { emoji: '🧩', title: '5. Minimal inputs', desc: 'Complex forms fail. Short, descriptive fields succeed. Inputs must be minimal and unambiguous.' },
                { emoji: '🧭', title: '6. Structure, not complexity', desc: "Volunteers don't need an enterprise dashboard. They need a list, urgency levels, and clear next steps." },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className={glassCard}>
                  <h3 className="font-bold text-white flex items-center mb-2">
                    <span className="mr-2">{emoji}</span> {title}
                  </h3>
                  <p className="text-sm text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
            <div className={`mt-4 ${glassCard} border-ocean-700/50`}>
              <h3 className="font-bold text-ocean-300 flex items-center mb-2">
                <span className="mr-2">🧘</span> 7. Emotional safety matters
              </h3>
              <p className="text-sm text-slate-400">A "Thank you, we've received your situation" message reduces panic. It's small but vital.</p>
            </div>
            <p className={`mt-4 ${bodyText}`}>Haven follows these principles by design.</p>
          </div>

          {/* Section 3 */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>3. Why Google Sheets? (The Case for Low-Tech Resilience)</h2>
            <p className={bodyText}>
              Most engineers default to databases like Supabase, PostgreSQL, or Firebase. But real-world crisis systems often need something very different:
            </p>
            <ul className="space-y-4 mt-4 mb-6">
              {[
                { title: 'People already know Sheets.', desc: 'No training. No onboarding. Every neighborhood volunteer understands sorting, filtering, copying, exporting, and simple formulas.' },
                { title: 'Sheets are collaborative by default.', desc: 'Multiple volunteers can work in the same spreadsheet without configuration.' },
                { title: 'Zero infrastructure.', desc: 'In a disaster, you cannot assume reliable servers, expensive cloud DBs, or domain expertise. Sheets are robust and require none of these.' },
                { title: 'Instant data visibility.', desc: 'Organizers can see new submissions, urgent cases, and counts immediately. No custom dashboard required.' },
                { title: 'Crisis-proof simplicity.', desc: 'Sheets do not go down because one backend crashed. This makes them ideal for community response and decentralized coordination.' },
              ].map(({ title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 bg-ocean-500 rounded-full flex-shrink-0" />
                  <div>
                    <strong className="text-white">{title}</strong>{' '}
                    <span className="text-slate-400">{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className={bodyText}>
              Haven uses Google Sheets not as a gimmick, but because <strong className="text-white">it is the most crisis-resilient backend available to ordinary people</strong>.
            </p>
          </div>

          {/* Section 4 */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>4. Product Philosophy</h2>
            <p className={bodyText}>
              Haven is intentionally not a full incident management system, a volunteer dispatching platform, or a data-heavy emergency engine. Those systems exist — and they often fail in grassroots contexts.
            </p>
            <p className={`${bodyText} mt-3`}>Instead, Haven asks a different question:</p>
            <blockquote className="border-l-4 border-ocean-500 pl-4 italic bg-ocean-900/30 py-4 pr-4 rounded-r-xl my-6 text-ocean-200 text-lg font-medium">
              What is the minimum structure needed for ordinary people to help each other when they are scared, confused, and in danger?
            </blockquote>
            <p className={bodyText}>From that question come these design commitments:</p>
            <ul className="space-y-4 mt-4">
              {[
                { icon: '🌱', title: 'Ultra-fast creation:', desc: '"Generate crisis form" must work in 1 click. No dragging fields. No accounts.' },
                { icon: '🌱', title: 'Template, not customization:', desc: 'In crisis mode, 95% of needed fields are universal (contact, location, people, needs). Templates reduce decision fatigue.' },
                { icon: '🌱', title: 'Public form must feel safe:', desc: 'No branding. No ads. No distractions.' },
                { icon: '🌱', title: 'Simple urgency classification:', desc: 'A keyword-based heuristic (or AI) is enough initially. The goal is triage, not diagnosis.' },
                { icon: '🌱', title: 'Graceful degradation:', desc: 'If AI fails → use heuristics. If backend fails → use Sheets. If Sheets fail → export CSV. Resilience by design.' },
              ].map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <strong className="text-white">{title}</strong>{' '}
                    <span className="text-slate-400">{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5 */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>5. Haven Color System</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: 'Deep Ocean', hex: '#0c4a6e', class: 'bg-ocean-900', label: 'Backgrounds, borders' },
                { name: 'Ocean Blue', hex: '#0ea5e9', class: 'bg-ocean-500', label: 'Primary actions, CTAs' },
                { name: 'Ocean Light', hex: '#38bdf8', class: 'bg-ocean-400', label: 'Links, highlights' },
                { name: 'Coral', hex: '#f43f5e', class: 'bg-coral-500', label: 'Critical alerts' },
                { name: 'Amber', hex: '#f59e0b', class: 'bg-amber-500', label: 'Moderate alerts' },
                { name: 'Emerald', hex: '#10b981', class: 'bg-emerald-500', label: 'Resolved, success' },
              ].map(({ name, hex, class: bg, label }) => (
                <div key={name} className={`${glassCard} flex flex-col gap-2`}>
                  <div className={`${bg} h-10 rounded-xl`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-500 font-mono">{hex}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6 */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>6. Future Directions</h2>
            <p className={bodyText}>Haven is an MVP, but it opens doors for meaningful extensions:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {[
                { icon: '🔧', text: 'Form customizer' },
                { icon: '🤖', text: 'AI-assisted urgency analysis' },
                { icon: '🗺', text: 'Volunteer coordination tools' },
                { icon: '📊', text: 'Incident-level analytics' },
                { icon: '🌍', text: 'Multi-language support' },
                { icon: '🔐', text: 'Lightweight authentication' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-slate-300">
                  <span className="text-ocean-400">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Closing */}
          <div className="border-t border-white/10 py-10">
            <h2 className={sectionTitle}>7. Closing Thoughts</h2>
            <div className="bg-ocean-900/50 border border-ocean-700/60 p-8 rounded-2xl text-center">
              <p className="text-xl font-serif italic text-ocean-200 mb-4">
                "People don't wait for perfect systems. In a crisis, they build the systems they need with the tools they have."
              </p>
              <p className="text-slate-400">
                Haven stands with that philosophy. It embraces low-tech, speed, human intuition, and community resilience.
              </p>
            </div>
            <p className="mt-6 text-center text-slate-500 text-sm">
              If it helps even one community organize faster in the next emergency, Haven will have fulfilled its purpose.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};