import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, Shield, Zap, Globe, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, text: 'AI & Machine Learning insights' },
  { icon: Shield, text: 'Cybersecurity news & analysis' },
  { icon: Globe, text: 'Cloud computing resources' },
  { icon: Zap, text: 'Data analytics deep-dives' },
];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (remember) localStorage.setItem('rememberedEmail', email);
        else localStorage.removeItem('rememberedEmail');
        navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-alt)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-hover)] to-[var(--color-accent)]">
        {/* Background decorations */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[rgba(255,255,255,0.1)] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-[rgba(255,255,255,0.08)] blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
        
        {/* Floating glass cards */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-[rgba(255,255,255,0.05)] backdrop-blur-sm rounded-2xl border border-[rgba(255,255,255,0.1)] pointer-events-none" />
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-[rgba(255,255,255,0.04)] backdrop-blur-sm rounded-xl border border-[rgba(255,255,255,0.08)] pointer-events-none" />

        {/* Logo */}
        <div className="mb-12 self-start">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl">
            <img src="/logo.jpg" alt="TGS Tech Info" className="h-12 w-auto rounded-xl" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center w-full">
          <div className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4">Welcome Back</div>
          <h1 className="text-white font-black text-4xl leading-tight mb-4 tracking-tight">
            Your Tech <span className="bg-gradient-to-r from-[var(--color-accent)] to-white bg-clip-text text-transparent">Intelligence</span> Awaits
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-[320px] mx-auto mb-10">
            Sign in to access exclusive articles, expert interviews, and the latest tech insights.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-4 w-full mb-10">
          {FEATURES.map((feature, index) => (
            <div key={index} className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-all duration-300">
                <feature.icon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <span className="text-sm text-white/90 font-medium group-hover:text-white transition-colors duration-300">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Testimonial card */}
        <div className="p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl w-full">
          <div className="text-sm text-white/80 leading-relaxed">
            "500+ tech experts. Weekly insights. Always free."
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] md:max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-heading)]">Sign In</h1>
            <p className="text-sm text-[var(--color-muted)]">Enter your credentials to access your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-body)]">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-body)]">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-body)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
                <label htmlFor="remember" className="text-sm text-[var(--color-body)] cursor-pointer hover:text-[var(--color-primary)] transition-colors">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-[var(--color-muted)]">Don't have an account? </span>
              <Link to="/register" className="text-[var(--color-primary)] font-bold hover:text-[var(--color-primary-hover)] transition-colors">
                Create Account →
              </Link>
            </div>

            {/* Demo Credentials */}
            <div className="bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-xl p-4 text-left">
              <div className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">Demo Credentials</div>
              <div className="text-xs text-[var(--color-body)] leading-relaxed">
                <div className="mb-1">👑 <strong>Admin:</strong> admin@tgstechinfo.com / Admin@123</div>
                <div>👤 <strong>User:</strong> user@tgstechinfo.com / User@123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
