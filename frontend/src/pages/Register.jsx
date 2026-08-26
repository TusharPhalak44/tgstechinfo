import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import {
  User, Mail, Lock, Phone, ArrowRight,
  Eye, EyeOff, AlertCircle, Loader2,
} from 'lucide-react';
import SaaSLeadJourneyAnimation from '../components/auth/SaaSLeadJourneyAnimation';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

  /* ── Absolutely no scroll ── */
  .rp-root {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    display: flex;
    font-family: 'DM Sans', sans-serif;
  }

  /* LEFT */
  .rp-left {
    width: 50%;
    flex-shrink: 0;
    display: none;
    overflow: hidden;
  }
  @media (min-width: 1024px) { .rp-left { display: block; } }

  /* RIGHT — clean white */
  .rp-right {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #ffffff;
  }

  /* White card */
  .rp-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 420px;
    margin: 0 24px;
    padding: 22px 28px 18px;
    background: #ffffff;
    border: 1px solid #E8EDF5;
    border-radius: 22px;
    box-shadow:
      0 4px 24px rgba(11,31,77,0.08),
      0 1px 4px rgba(11,31,77,0.06);
    animation: rCardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes rCardIn {
    from { opacity:0; transform:translateY(24px) scale(0.96); }
    to   { opacity:1; transform:none; }
  }

  /* Standalone Animated Logo — Clean, Enlarged & Floating */
  .rp-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    position: relative;
  }
  .rp-logo-img {
    height: 72px;
    width: auto;
    max-width: 250px;
    object-fit: contain;
    filter: drop-shadow(0 6px 16px rgba(11, 31, 77, 0.12));
    animation: rpLogoLiveFloat 3.8s ease-in-out infinite alternate;
    transition: transform 0.3s ease, filter 0.3s ease;
    cursor: pointer;
  }
  .rp-logo-img:hover {
    transform: translateY(-8px) scale(1.06);
    filter: drop-shadow(0 12px 24px rgba(247, 148, 29, 0.28));
  }
  @keyframes rpLogoLiveFloat {
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
  .rp-logo-fb {
    width: 68px; height: 68px;
    border-radius: 18px;
    background: linear-gradient(135deg,#0B1F4D,#1a365d);
    color:#fff; font-weight:800; font-size:1.3rem;
    display:flex; align-items:center; justify-content:center;
    box-shadow: 0 10px 24px rgba(11,31,77,0.25);
    animation: rpLogoLiveFloat 3.8s ease-in-out infinite alternate;
  }

  /* Heading / quote */
  .rp-heading { text-align:center; margin-bottom:14px; }
  .rp-heading h1 {
    font-family:'Playfair Display',serif;
    font-size:1.35rem; font-weight:700;
    color:#0F172A; line-height:1.22;
    margin-bottom:4px; letter-spacing:-0.02em;
  }
  .rp-heading h1 em { font-style:italic; color:#F7941D; }
  .rp-heading p {
    font-size:.75rem; color:#64748B;
    line-height:1.45; font-weight:400;
  }

  /* Name grid */
  .rp-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; }

  /* Field — super compact */
  .rp-f { margin-bottom:8px; }
  .rp-lbl {
    display:block; font-size:.68rem; font-weight:600;
    color:#475569; margin-bottom:4px; letter-spacing:.03em;
  }
  .rp-iw { position:relative; }
  .rp-ii {
    position:absolute; left:11px; top:50%; transform:translateY(-50%);
    width:14px; height:14px; color:#94A3B8;
    pointer-events:none; z-index:2; transition:color .2s;
  }
  .rp-iw:focus-within .rp-ii { color:#0B1F4D; }
  .rp-input {
    width:100%; height:38px;
    padding:0 11px 0 34px;
    border-radius:9px;
    font-size:.82rem; font-family:'DM Sans',sans-serif;
    outline:none; box-sizing:border-box;
    transition:all .22s cubic-bezier(.22,1,.36,1);
    background:#F8FAFC;
    border:1.5px solid #E2E8F0;
    color:#0F172A;
  }
  .rp-input::placeholder { color:#94A3B8; }
  .rp-input:focus {
    border-color:#0B1F4D;
    background:#ffffff;
    box-shadow:0 0 0 3px rgba(11,31,77,0.08);
  }
  .rp-input--e { border-color:#DC2626!important; }
  .rp-eye {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    color:#94A3B8; padding:3px; border-radius:5px;
    transition:color .2s; z-index:2; line-height:0;
  }
  .rp-eye:hover { color:#475569; }
  .rp-ferr {
    font-size:.65rem; color:#DC2626; margin-top:2px;
    display:flex; align-items:center; gap:3px;
  }

  /* Strength — minimal */
  .rp-str { margin-top:4px; display:flex; align-items:center; gap:6px; }
  .rp-str-track {
    flex:1; height:2.5px; border-radius:2px;
    background:#E2E8F0; overflow:hidden;
  }
  .rp-str-fill { height:100%; border-radius:2px; transition:width .4s, background .3s; }
  .rp-str-lbl { font-size:.6rem; font-weight:600; min-width:34px; text-align:right; }
  .rp-rules { display:flex; flex-wrap:wrap; gap:2px 9px; margin-top:3px; }
  .rp-rule {
    display:flex; align-items:center; gap:3px;
    font-size:.6rem; color:#94A3B8;
  }
  .rp-rule--p { color:#16A34A; }
  .rp-dot { width:4px; height:4px; border-radius:50%; background:#CBD5E1; flex-shrink:0; }
  .rp-rule--p .rp-dot { background:#16A34A; }

  /* Agreement */
  .rp-agree { display:flex; align-items:flex-start; gap:7px; margin-bottom:10px; margin-top:2px; }
  .rp-cb {
    width:15px; height:15px; border-radius:4px;
    border:1.5px solid #CBD5E1;
    appearance:none; -webkit-appearance:none;
    cursor:pointer; transition:all .2s; position:relative;
    flex-shrink:0; margin-top:2px; background:#ffffff;
  }
  .rp-cb:checked { background:#0B1F4D; border-color:#0B1F4D; }
  .rp-cb:checked::after {
    content:'✓'; position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:8px; font-weight:800;
  }
  .rp-agree-txt {
    font-size:.73rem; color:#64748B;
    line-height:1.5; cursor:pointer;
  }
  .rp-agree-txt a { color:#0B1F4D; text-decoration:none; transition:color .2s; }
  .rp-agree-txt a:hover { color:#F7941D; }

  /* Button */
  .rp-btn {
    width:100%; height:44px; border:none; border-radius:11px;
    font-family:'DM Sans',sans-serif; font-size:.88rem; font-weight:700;
    color:#fff; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    position:relative; overflow:hidden;
    transition:all .3s cubic-bezier(.22,1,.36,1);
    background:linear-gradient(135deg,#F7941D 0%,#E67E00 100%);
    box-shadow:0 4px 20px rgba(247,148,29,.38);
    margin-bottom:12px;
  }
  .rp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(247,148,29,.52); }
  .rp-btn:active:not(:disabled) { transform:translateY(0); }
  .rp-btn:disabled { opacity:.55; cursor:not-allowed; }
  .rp-btn::after {
    content:''; position:absolute; top:0; left:-100%;
    width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
    transition:left .55s;
  }
  .rp-btn:hover:not(:disabled)::after { left:100%; }

  /* Switch */
  .rp-switch { text-align:center; font-size:.78rem; color:#64748B; }
  .rp-switch a { font-weight:700; text-decoration:none; color:#0B1F4D; margin-left:4px; transition:color .2s; }
  .rp-switch a:hover { color:#F7941D; }

  @keyframes spin { to { transform:rotate(360deg); } }
`;

const Register = () => {
  const { cmsLogo, mainLogo } = useSiteSettings();
  const logoSrc               = cmsLogo || mainLogo;
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [agree, setAgree]     = useState(false);
  const [fd, setFd]           = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirmPassword:'' });
  const [errors, setErrors]   = useState({});
  const { register }          = useAuth();
  const navigate              = useNavigate();

  const validate = () => {
    const e = {};
    if (!fd.firstName.trim()) e.firstName = 'Required';
    if (!fd.lastName.trim())  e.lastName  = 'Required';
    if (!fd.email.trim())     e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) e.email = 'Invalid email';
    if (!fd.password)         e.password = 'Required';
    else if (fd.password.length < 12) e.password = 'Min 12 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(fd.password))
      e.password = 'Need uppercase, number & symbol';
    if (!fd.confirmPassword)              e.confirmPassword = 'Required';
    else if (fd.password !== fd.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agree) e.agree = 'Please agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pwStr = (pw) => {
    let s = 0;
    if (pw.length >= 12) s++;
    if (pw.length >= 16) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw))    s++;
    if (/[!@#$%^&*]/.test(pw)) s++;
    return s;
  };
  const strColor = (s) => s <= 2 ? '#ef4444' : s <= 4 ? '#f59e0b' : '#10b981';
  const strLabel = (s) => s <= 2 ? 'Weak' : s <= 4 ? 'Medium' : 'Strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register({
        first_name: fd.firstName, last_name: fd.lastName,
        email: fd.email, password: fd.password, role: 'user',
      });
      if (result.success) navigate('/');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const hc = (e) => {
    const { name, value } = e.target;
    setFd((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const s = pwStr(fd.password);
  const rules = [
    { label: '12+',       pass: fd.password.length >= 12 },
    { label: 'Lower',     pass: /[a-z]/.test(fd.password) },
    { label: 'Upper',     pass: /[A-Z]/.test(fd.password) },
    { label: 'Number',    pass: /\d/.test(fd.password) },
    { label: 'Symbol',    pass: /[!@#$%^&*]/.test(fd.password) },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="rp-root">

        {/* LEFT — flowchart */}
        <div className="rp-left"><SaaSLeadJourneyAnimation /></div>

        {/* RIGHT — gradient + glass card */}
        <div className="rp-right">
          <div className="rp-card">

            {/* Standalone Animated Logo */}
            <div className="rp-logo">
              {logoSrc
                ? <img src={logoSrc} alt="TGS Tech Info" className="rp-logo-img" />
                : <div className="rp-logo-fb">TGS</div>
              }
            </div>

            {/* Quote heading */}
            <div className="rp-heading">
              <h1>Start your <em>publishing</em> journey.<br />Get the leads.</h1>
              <p>Join thousands of publishers growing with TGS Tech Info.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Name row */}
              <div className="rp-grid">
                <div className="rp-f">
                  <label htmlFor="rg-fn" className="rp-lbl">First Name</label>
                  <div className="rp-iw">
                    <User className="rp-ii" />
                    <input id="rg-fn" name="firstName" placeholder="John"
                      value={fd.firstName} onChange={hc}
                      className={`rp-input${errors.firstName?' rp-input--e':''}`}
                      autoComplete="given-name" required />
                  </div>
                  {errors.firstName && <div className="rp-ferr"><AlertCircle size={10}/>{errors.firstName}</div>}
                </div>
                <div className="rp-f">
                  <label htmlFor="rg-ln" className="rp-lbl">Last Name</label>
                  <div className="rp-iw">
                    <User className="rp-ii" />
                    <input id="rg-ln" name="lastName" placeholder="Doe"
                      value={fd.lastName} onChange={hc}
                      className={`rp-input${errors.lastName?' rp-input--e':''}`}
                      autoComplete="family-name" required />
                  </div>
                  {errors.lastName && <div className="rp-ferr"><AlertCircle size={10}/>{errors.lastName}</div>}
                </div>
              </div>

              {/* Email */}
              <div className="rp-f">
                <label htmlFor="rg-em" className="rp-lbl">Email Address</label>
                <div className="rp-iw">
                  <Mail className="rp-ii" />
                  <input id="rg-em" name="email" type="email" placeholder="you@example.com"
                    value={fd.email} onChange={hc}
                    className={`rp-input${errors.email?' rp-input--e':''}`}
                    autoComplete="email" required />
                </div>
                {errors.email && <div className="rp-ferr"><AlertCircle size={10}/>{errors.email}</div>}
              </div>

              {/* Phone */}
              <div className="rp-f">
                <label htmlFor="rg-ph" className="rp-lbl">
                  Phone <span style={{ fontWeight:400, color:'rgba(255,255,255,.2)', fontSize:'.62rem' }}>(optional)</span>
                </label>
                <div className="rp-iw">
                  <Phone className="rp-ii" />
                  <input id="rg-ph" name="phone" type="tel" placeholder="+1 234 567 8900"
                    value={fd.phone} onChange={hc}
                    className="rp-input" autoComplete="tel" />
                </div>
              </div>

              {/* Password */}
              <div className="rp-f">
                <label htmlFor="rg-pw" className="rp-lbl">Password</label>
                <div className="rp-iw">
                  <Lock className="rp-ii" />
                  <input id="rg-pw" name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={fd.password} onChange={hc}
                    className={`rp-input${errors.password?' rp-input--e':''}`}
                    style={{ paddingRight:40 }}
                    autoComplete="new-password" required />
                  <button type="button" className="rp-eye"
                    onClick={() => setShowPw(!showPw)} aria-label="Toggle">
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                {fd.password && (
                  <>
                    <div className="rp-str">
                      <div className="rp-str-track">
                        <div className="rp-str-fill" style={{ width:`${(s/6)*100}%`, background:strColor(s) }} />
                      </div>
                      <span className="rp-str-lbl" style={{ color:strColor(s) }}>{strLabel(s)}</span>
                    </div>
                    <div className="rp-rules">
                      {rules.map((r) => (
                        <div key={r.label} className={`rp-rule${r.pass?' rp-rule--p':''}`}>
                          <div className="rp-dot"/>{r.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {errors.password && <div className="rp-ferr"><AlertCircle size={10}/>{errors.password}</div>}
              </div>

              {/* Confirm password */}
              <div className="rp-f">
                <label htmlFor="rg-cpw" className="rp-lbl">Confirm Password</label>
                <div className="rp-iw">
                  <Lock className="rp-ii" />
                  <input id="rg-cpw" name="confirmPassword"
                    type={showCPw ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={fd.confirmPassword} onChange={hc}
                    className={`rp-input${errors.confirmPassword?' rp-input--e':''}`}
                    style={{ paddingRight:40 }}
                    autoComplete="new-password" required />
                  <button type="button" className="rp-eye"
                    onClick={() => setShowCPw(!showCPw)} aria-label="Toggle">
                    {showCPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                {errors.confirmPassword && <div className="rp-ferr"><AlertCircle size={10}/>{errors.confirmPassword}</div>}
              </div>

              {/* Agreement */}
              <div className="rp-agree">
                <input type="checkbox" id="rg-ag" checked={agree}
                  onChange={(e) => setAgree(e.target.checked)} className="rp-cb" />
                <label htmlFor="rg-ag" className="rp-agree-txt">
                  I agree to the <Link to="/terms-of-use">Terms of Service</Link> and <Link to="/privacy-policy">Privacy Policy</Link>
                </label>
              </div>
              {errors.agree && <div className="rp-ferr" style={{ marginTop:-6, marginBottom:8 }}><AlertCircle size={10}/>{errors.agree}</div>}

              {/* Submit */}
              <button id="register-submit" type="submit" disabled={loading} className="rp-btn">
                {loading
                  ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/><span>Creating account…</span></>
                  : <><span>Create Free Account</span><ArrowRight size={15}/></>
                }
              </button>
            </form>

            {/* Switch */}
            <div className="rp-switch">
              Already have an account?<Link to="/login">Sign in →</Link>
            </div>

          </div>{/* /card */}
        </div>{/* /right */}
      </div>
    </>
  );
};

export default Register;
