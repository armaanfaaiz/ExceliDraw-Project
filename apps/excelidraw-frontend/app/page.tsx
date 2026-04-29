import { Share2, Users2, Sparkles, Github, Download, ArrowRight, Palette, Zap, Shield, Pencil, PenTool } from "lucide-react";
import Link from "next/link";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                ExceliDraw
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/signin">
                <button className="text-slate-300 hover:text-white transition-colors font-medium">
                  Sign in
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-lg font-medium transition-all">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full border border-violet-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium">New: Real-time collaboration</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              Collaborative Drawing
              <span className="block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Create, collaborate, and share beautiful diagrams and sketches with our intuitive drawing tool. 
              No sign-up required to get started.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Link href="/signup">
                <button className="h-12 px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-medium shadow-lg shadow-violet-500/30 flex items-center gap-2 transition-all">
                  Start Drawing Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/signin">
                <button className="h-12 px-8 bg-transparent border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-800 hover:text-white transition-all">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
          
          {/* Decorative Pencil Icons */}
          <div className="absolute top-20 left-10 opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
            <Pencil className="w-16 h-16 text-violet-400" />
          </div>
          <div className="absolute top-40 right-20 opacity-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <PenTool className="w-20 h-20 text-fuchsia-400" />
          </div>
          <div className="absolute bottom-20 left-1/4 opacity-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <Pencil className="w-12 h-12 text-blue-400" />
          </div>
          <div className="absolute bottom-32 right-1/3 opacity-20 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>
            <PenTool className="w-14 h-14 text-emerald-400" />
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-slate-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to create
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Powerful features designed for teams and individuals alike
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Share2 className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Real-time Collaboration</h3>
              </div>
              <p className="text-slate-400">
                Work together with your team in real-time. Share your drawings instantly with a simple link.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Users2 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Multiplayer Editing</h3>
              </div>
              <p className="text-slate-400">
                Multiple users can edit the same canvas simultaneously. See who&apos;s drawing what in real-time.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Zap className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Lightning Fast</h3>
              </div>
              <p className="text-slate-400">
                Instant sync and zero latency. Your drawings save automatically as you create them.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Sparkles className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Smart Tools</h3>
              </div>
              <p className="text-slate-400">
                Pencil, rectangle, and circle tools to create perfect diagrams effortlessly.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-rose-500/20">
                  <Shield className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Auto-Save</h3>
              </div>
              <p className="text-slate-400">
                Never lose your work. Every stroke is automatically saved to the cloud.
              </p>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/20">
                  <Download className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Export Anytime</h3>
              </div>
              <p className="text-slate-400">
                Download your creations as PNG images with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 sm:p-16 shadow-2xl shadow-violet-500/30">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                Ready to start creating?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-violet-100">
                Join thousands of users who are already creating amazing diagrams and sketches.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-4">
                <Link href="/signup">
                  <button className="h-12 px-8 bg-white text-violet-600 rounded-xl font-medium hover:bg-slate-100 flex items-center gap-2 transition-all">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-slate-400">
                2024 ExceliDraw. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="https://github.com" className="text-slate-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;