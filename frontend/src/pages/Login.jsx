import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Star } from 'lucide-react';
import SaaSLeadJourneyAnimation from '../components/auth/SaaSLeadJourneyAnimation';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');

  /* ── Page: no scrollbar ever ── */
  .lp-root {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    display: flex;
    font-family: 'DM Sans', sans-serif;
  }

  /* LEFT — flowchart */
  .lp-left {
    width: 50%;
    flex-shrink: 0;
    display: none;
    position: relative;
    overflow: hidden;
  }
  @media (min-width: 1024px) { .lp-left { display: block; } }

  /* RIGHT — clean white */
  .lp-right {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #ffffff;
  }

  /* White card */
  .lp-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 400px;
    margin: 0 28px;
    padding: 32px 32px 24px;
    background: #ffffff;
    border: 1px solid #E8EDF5;
    border-radius: 24px;
    box-shadow:
      0 4px 24px rgba(11,31,77,0.08),
      0 1px 4px rgba(11,31,77,0.06);
    animation: cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardIn {
    from { opacity:0; transform:translateY(28px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* Standalone Animated Logo — Clean, Enlarged & Floating */
  .lp-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 22px;
    position: relative;
  }
  .lp-logo-img {
    height: 72px;
    width: auto;
    max-width: 250px;
    object-fit: contain;
    filter: drop-shadow(0 6px 16px rgba(11, 31, 77, 0.12));
    animation: logoLiveFloat 3.8s ease-in-out infinite alternate;
    transition: transform 0.3s ease, filter 0.3s ease;
    cursor: pointer;
  }
  .lp-logo-img:hover {
    transform: translateY(-8px) scale(1.06);
    filter: drop-shadow(0 12px 24px rgba(247, 148, 29, 0.28));
  }
  @keyframes logoLiveFloat {
    0% {
      transform: translateY(0px) scale(1);
      filter: drop-shadow(0 4px 10px rgba(11, 31, 77, 0.08));
    }
    50% {
      transform: translateY(-8px) scale(1.03);
      filter: drop-shadow(0 14px 22px rgba(247, 148, 29, 0.22));
    }
    100% {
      transform: translateY(0px) scale(1);
      filter: drop-shadow(0 4px 10px rgba(11, 31, 77, 0.08));
    }
  }
  .lp-logo-fallback {
    width: 68px; height: 68px;
    border-radius: 18px;
    background: linear-gradient(135deg,#0B1F4D,#1a365d);
    color:#fff; font-weight:800; font-size:1.3rem;
    display:flex; align-items:center; justify-content:center;
    box-shadow: 0 10px 24px rgba(11,31,77,0.25);
    animation: logoLiveFloat 3.8s ease-in-out infinite alternate;
  }

  /* Heading */
  .lp-heading { text-align: center; margin-bottom: 20px; }
  .lp-heading h1 {
    font-family: 'Playfair Display', serif;
    font-size: 1.7rem; font-weight: 700;
    color: #0F172A; line-height: 1.2;
    margin-bottom: 6px; letter-spacing: -0.02em;
  }
  .lp-heading h1 em { font-style: italic; color: #F7941D; }
  .lp-heading p {
    font-size: 0.82rem;
    color: #64748B;
    line-height: 1.5; font-weight: 400;
  }

  /* Alert */
  .lp-alert {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 13px; border-radius: 12px;
    margin-bottom: 14px; font-size: 0.8rem; line-height: 1.5;
    animation: alertIn 0.3s ease-out;
  }
  @keyframes alertIn { from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;} }
  .lp-alert--err { background:rgba(220,38,38,.08); border:1px solid rgba(220,38,38,.2); color:#DC2626; }
  .lp-alert--ok  { background:rgba(22,163,74,.08);  border:1px solid rgba(22,163,74,.2);  color:#16A34A; }
  .lp-alert svg  { flex-shrink:0; margin-top:1px; }

  /* Field */
  .lp-field { margin-bottom: 12px; }
  .lp-label {
    display: block; font-size: 0.73rem; font-weight: 600;
    color: #475569; margin-bottom: 5px; letter-spacing: 0.03em;
  }
  .lp-iw { position: relative; }
  .lp-ii {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    width: 15px; height: 15px; color: #94A3B8;
    pointer-events: none; z-index: 2; transition: color .2s;
  }
  .lp-iw:focus-within .lp-ii { color: #0B1F4D; }
  .lp-input {
    width: 100%; height: 44px;
    padding: 0 12px 0 38px;
    border-radius: 11px;
    font-size: 0.86rem; font-family: 'DM Sans', sans-serif;
    outline: none; box-sizing: border-box;
    transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    color: #0F172A;
  }
  .lp-input::placeholder { color: #94A3B8; }
  .lp-input:focus {
    border-color: #0B1F4D;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(11,31,77,0.08);
  }
  .lp-input--err { border-color: #DC2626!important; }
  .lp-eye {
    position:absolute; right:11px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    color:#94A3B8; padding:4px; border-radius:5px;
    transition:color .2s; z-index:2; line-height:0;
  }
  .lp-eye:hover { color:#475569; }

  /* Remember / Forgot */
  .lp-row {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom: 16px;
  }
  .lp-ck-wrap { display:flex; align-items:center; gap:7px; cursor:pointer; }
  .lp-ck {
    width:16px; height:16px; border-radius:5px;
    border:1.5px solid #CBD5E1;
    appearance:none; -webkit-appearance:none;
    cursor:pointer; transition:all .2s; position:relative;
    flex-shrink:0; background:#ffffff;
  }
  .lp-ck:checked { background:#0B1F4D; border-color:#0B1F4D; }
  .lp-ck:checked::after {
    content:'✓'; position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:9px; font-weight:800;
  }
  .lp-ck-lbl { font-size:.77rem; font-weight:500; color:#64748B; cursor:pointer; }
  .lp-forgot {
    font-size:.77rem; font-weight:600;
    color:#0B1F4D; text-decoration:none; transition:color .2s;
  }
  .lp-forgot:hover { color:#F7941D; }

  /* Submit button */
  .lp-btn {
    width:100%; height:48px; border:none; border-radius:12px;
    font-family:'DM Sans',sans-serif; font-size:.9rem; font-weight:700;
    color:#fff; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:9px;
    position:relative; overflow:hidden;
    transition:all .3s cubic-bezier(0.22,1,0.36,1);
    background:linear-gradient(135deg,#F7941D 0%,#E67E00 100%);
    box-shadow:0 4px 22px rgba(247,148,29,0.4);
    margin-bottom:16px;
  }
  .lp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 30px rgba(247,148,29,0.55); }
  .lp-btn:active:not(:disabled) { transform:translateY(0); }
  .lp-btn:disabled { opacity:.55; cursor:not-allowed; }
  .lp-btn::after {
    content:''; position:absolute; top:0; left:-100%;
    width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
    transition:left .55s;
  }
  .lp-btn:hover:not(:disabled)::after { left:100%; }

  /* Switch */
  .lp-switch { text-align:center; font-size:.82rem; color:#64748B; margin-bottom:14px; }
  .lp-switch a { font-weight:700; text-decoration:none; color:#0B1F4D; margin-left:4px; transition:color .2s; }
  .lp-switch a:hover { color:#F7941D; }

  /* Demo box */
  .lp-demo {
    padding:11px 13px; border-radius:11px;
    background:#FFF7ED;
    border:1px solid #FED7AA;
  }
  .lp-demo-hd {
    font-size:.6rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.14em;
    color:#EA580C; margin-bottom:5px;
    display:flex; align-items:center; gap:5px;
  }
  .lp-demo-row { font-size:.72rem; line-height:1.7; color:#78716C; }

  @keyframes spin { to { transform:rotate(360deg); } }
`;

const Login = () => {
  const { darkMode }                      = useTheme();
  const { cmsLogo, mainLogo }             = useSiteSettings();
  const [loading, setLoading]             = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [remember, setRemember]           = useState(false);
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);
  const { login, isAuthenticated, user }  = useAuth();
  const navigate                          = useNavigate();

  useEffect(() => {
    const r = localStorage.getItem('rememberedEmail');
    if (r) { setEmail(r); setRemember(true); }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setSuccess(true);
      setTimeout(() => navigate(user?.role === 'admin' ? '/admin' : '/user-dashboard'), 500);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (remember) localStorage.setItem('rememberedEmail', email);
        else localStorage.removeItem('rememberedEmail');
        setSuccess(true);
      } else {
        setError(result.message || result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logoSrc = cmsLogo || mainLogo;

  return (
    <>
      <style>{styles}</style>
      <div className="lp-root">

        {/* LEFT — flowchart fills its full height */}
        <div className="lp-left">
          <SaaSLeadJourneyAnimation />
        </div>

        {/* RIGHT — vivid gradient + glass card */}
        <div className="lp-right">
          <div className="lp-card">

            {/* Standalone Animated Logo */}
            <div className="lp-logo">
              {logoSrc
                ? <img src={logoSrc} alt="TGS Tech Info" className="lp-logo-img" />
                : <div className="lp-logo-fallback">TGS</div>
              }
            </div>

            {/* Heading */}
            <div className="lp-heading">
              <h1>Welcome back to <em>TGS Tech</em></h1>
              <p>What's new today? Sign in and find out.</p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="lp-alert lp-alert--err" role="alert">
                <AlertCircle size={15} />
                <div><strong style={{ display:'block', marginBottom:1 }}>Login failed</strong>{error}</div>
              </div>
            )}
            {success && (
              <div className="lp-alert lp-alert--ok" role="status">
                <CheckCircle size={15} /><strong>Success — redirecting…</strong>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="lp-field">
                <label htmlFor="login-email" className="lp-label">Email Address</label>
                <div className="lp-iw">
                  <Mail className="lp-ii" aria-hidden="true" />
                  <input
                    id="login-email" type="email" autoComplete="email"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className={`lp-input${error ? ' lp-input--err' : ''}`}
                    required disabled={loading || success}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lp-field">
                <label htmlFor="login-password" className="lp-label">Password</label>
                <div className="lp-iw">
                  <Lock className="lp-ii" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className={`lp-input${error ? ' lp-input--err' : ''}`}
                    style={{ paddingRight:44 }}
                    required disabled={loading || success}
                  />
                  <button type="button" className="lp-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide' : 'Show'}
                    disabled={loading || success}>
                    {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="lp-row">
                <label className="lp-ck-wrap">
                  <input type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="lp-ck" disabled={loading || success} aria-label="Remember me" />
                  <span className="lp-ck-lbl">Remember me</span>
                </label>
                <Link to="/forgot-password" className="lp-forgot">Forgot password?</Link>
              </div>

              {/* Submit */}
              <button type="submit" id="login-submit" disabled={loading || success} className="lp-btn">
                {loading
                  ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/><span>Signing in…</span></>
                  : success
                  ? <><CheckCircle size={16}/><span>Success!</span></>
                  : <><span>Sign In</span><ArrowRight size={16}/></>
                }
              </button>
            </form>

            {/* Switch */}
            <div className="lp-switch">
              Don't have an account?<Link to="/register">Create account →</Link>
            </div>

            {/* Demo credentials */}
            <div className="lp-demo">
              <div className="lp-demo-hd"><Star size={9}/>Demo Credentials</div>
              <div className="lp-demo-row">
                <div>👑 <strong style={{ color:'rgba(255,255,255,0.58)' }}>Admin:</strong> admin@tgstechinfo.com / Admin@123</div>
                <div>👤 <strong style={{ color:'rgba(255,255,255,0.58)' }}>User:</strong> user@tgstechinfo.com / User@123</div>
              </div>
            </div>

          </div>{/* /card */}
        </div>{/* /right */}
      </div>
    </>
  );
};

export default Login;
