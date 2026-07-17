import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, Newspaper, Mic, Mail as MailIcon, Trophy, Shield, CheckCircle, XCircle } from 'lucide-react';

const PERKS = [
  { icon: Newspaper, text: 'Access 500+ exclusive articles' },
  { icon: Mic, text: 'Expert interviews & podcasts' },
  { icon: MailIcon, text: 'Weekly tech digest newsletter' },
  { icon: Trophy, text: 'Publish your own content' },
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      newErrors.password = 'At least 12 characters required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
      newErrors.password = 'Must include uppercase, lowercase, number & special character';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreement) newErrors.agreement = 'Please agree to continue';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength <= 2) return '#ef4444';
    if (strength <= 4) return '#f59e0b';
    return '#10b981';
  };

  const getStrengthLabel = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: 'user'
      });
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-alt)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-hover)] to-[var(--color-success)]">
        {/* Background decorations */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[rgba(255,255,255,0.1)] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-[rgba(255,255,255,0.08)] blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
        
        {/* Floating glass cards */}
        <div className="absolute top-24 right-16 w-28 h-28 bg-[rgba(255,255,255,0.05)] backdrop-blur-sm rounded-2xl border border-[rgba(255,255,255,0.1)] pointer-events-none" />
        <div className="absolute bottom-28 left-20 w-20 h-20 bg-[rgba(255,255,255,0.04)] backdrop-blur-sm rounded-xl border border-[rgba(255,255,255,0.08)] pointer-events-none" />

        {/* Logo */}
        <div className="mb-12 self-start">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl">
            <img src="/logo.jpg" alt="TGS Tech Info" className="h-12 w-auto rounded-xl" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center w-full">
          <div className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">Join Free Today</div>
          <h1 className="text-white font-black text-4xl leading-tight mb-4 tracking-tight">
            Join 50,000+ <span className="bg-gradient-to-r from-white to-[var(--color-primary-light)] bg-clip-text text-transparent">Tech Professionals</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-[300px] mx-auto mb-10">
            Get exclusive content, expert insights, and the latest tech news — completely free.
          </p>
        </div>

        {/* Perks */}
        <div className="flex flex-col gap-4 w-full mb-10">
          {PERKS.map((perk, index) => (
            <div key={index} className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-all duration-300">
                <perk.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-white/90 font-medium group-hover:text-white transition-colors duration-300">{perk.text}</span>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex gap-8 justify-center w-full">
          {[
            { icon: Shield, label: 'Secure' },
            { icon: CheckCircle, label: 'Free Forever' },
            { icon: XCircle, label: 'No Spam' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 group">
              <badge.icon className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
              <span className="text-xs text-white/80 font-semibold group-hover:text-white transition-colors">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] md:max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-heading)]">Create Account</h1>
            <p className="text-sm text-[var(--color-muted)]">Join the TGS Tech Info community today</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-body)]">First Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                  <input
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                    required
                  />
                </div>
                {errors.firstName && <p className="text-xs text-[var(--color-error)]">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-body)]">Last Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                  <input
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                    required
                  />
                </div>
                {errors.lastName && <p className="text-xs text-[var(--color-error)]">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-body)]">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                  required
                />
              </div>
              {errors.email && <p className="text-xs text-[var(--color-error)]">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-body)]">Phone Number (Optional)</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  name="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-body)]">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
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
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(getPasswordStrength(formData.password) / 6) * 100}%`,
                          backgroundColor: getStrengthColor(getPasswordStrength(formData.password))
                        }}
                      />
                    </div>
                    <span 
                      className="text-xs font-medium"
                      style={{ color: getStrengthColor(getPasswordStrength(formData.password)) }}
                    >
                      {getStrengthLabel(getPasswordStrength(formData.password))}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-muted)] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={formData.password.length >= 12 ? 'text-green-500' : 'text-gray-400'}>
                        {formData.password.length >= 12 ? '✓' : '○'}
                      </span>
                      <span>At least 12 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                        {/[a-z]/.test(formData.password) ? '✓' : '○'}
                      </span>
                      <span>Lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                        {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                      </span>
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={/\d/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                        {/\d/.test(formData.password) ? '✓' : '○'}
                      </span>
                      <span>Number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}
                      </span>
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-xs text-[var(--color-error)]">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-body)]">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-body)] transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-[var(--color-error)]">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agreement"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded-sm border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <label htmlFor="agreement" className="text-sm text-[var(--color-body)] cursor-pointer leading-tight">
                I agree to the{' '}
                <Link to="/terms-of-use" className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-primary-hover)] transition-colors">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-primary-hover)] transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreement && <p className="text-xs text-[var(--color-error)]">{errors.agreement}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[var(--color-accent)]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-[var(--color-muted)]">Already have an account? </span>
              <Link to="/login" className="text-[var(--color-primary)] font-bold hover:text-[var(--color-primary-hover)] transition-colors">
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
