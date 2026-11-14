import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Keep a failed route inside the shell so navigation to other spaces still works. */
export class SpaceBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Space rendering failed:', error, info); }
  render() {
    if (this.state.failed) return this.props.fallback ?? <section role="alert" className="space-y-4 rounded-2xl border border-red-400/30 p-6 text-center">
      <p>تعذر فتح المساحة. يمكنك إعادة المحاولة أو الانتقال لمساحة أخرى.</p>
      <button type="button" className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button>
    </section>;
    return this.props.children;
  }
}
