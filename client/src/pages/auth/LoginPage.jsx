import { useState, useEffect } from 'react';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Lock,
  Mail,
  GraduationCap,
  BookOpen,
  Wrench,
  BarChart3,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_CONFIG } from '../../services/authService';
import { Modal } from '../../components/common/Modal';

const PORTAL_ROLES = [
  { key: 'STUDENT', label: 'Student', icon: GraduationCap, badgeClass: 'icon-badge-blue' },
  { key: 'FACULTY', label: 'Faculty', icon: BookOpen, badgeClass: 'icon-badge-indigo' },
  { key: 'COORDINATOR', label: 'Coordinator', icon: ShieldCheck, badgeClass: 'icon-badge-amber' },
  { key: 'ADMIN', label: 'Administrator', icon: Lock, badgeClass: 'icon-badge-rose' },
  { key: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, badgeClass: 'icon-badge-emerald' },
  { key: 'MANAGEMENT', label: 'Management', icon: BarChart3, badgeClass: 'icon-badge-blue' }
];

const DEMO_PERSONAS = [
  { role: 'STUDENT', name: 'Rohan Gupta', email: 'rohan.gupta@campus.edu' },
  { role: 'FACULTY', name: 'Dr. Anita Sharma', email: 'anita.sharma@campus.edu' },
  { role: 'COORDINATOR', name: 'Vikram Rao', email: 'vikram.rao@campus.edu' },
  { role: 'ADMIN', name: 'Arjun Nair', email: 'arjun.nair@campus.edu' },
  { role: 'MAINTENANCE', name: 'Deepak Yadav', email: 'deepak.yadav@campus.edu' },
  { role: 'MANAGEMENT', name: 'Kavita Menon', email: 'kavita.menon@campus.edu' }
];

export function LoginPage({ initialRole = 'STUDENT' }) {
  const { login } = useAuth();
  const { navigate, currentPath } = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const roleFromUrl = currentPath.split('/')[2]?.toUpperCase();
  const activeRole = ROLE_CONFIG[roleFromUrl] ? roleFromUrl : initialRole;

  const [selectedRole, setSelectedRole] = useState(activeRole);
  const [email, setEmail] = useState('rohan.gupta@campus.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if (roleFromUrl && ROLE_CONFIG[roleFromUrl]) {
      setSelectedRole(roleFromUrl);
      const persona = DEMO_PERSONAS.find(p => p.role === roleFromUrl);
      if (persona) setEmail(persona.email);
    }
  }, [roleFromUrl]);

  const handlePortalChange = (roleKey) => {
    setSelectedRole(roleKey);
    setErrorMsg('');
    const persona = DEMO_PERSONAS.find(p => p.role === roleKey);
    if (persona) setEmail(persona.email);
    navigate(`/login/${roleKey.toLowerCase()}`);
  };

  const handlePersonaSelect = (e) => {
    const personaEmail = e.target.value;
    if (!personaEmail) return;
    const persona = DEMO_PERSONAS.find(p => p.email === personaEmail);
    if (persona) {
      setEmail(persona.email);
      handlePortalChange(persona.role);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const verifiedUser = await login(email, password, selectedRole);
      navigate(`/${verifiedUser.role.toLowerCase()}/dashboard`);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePortalInfo = PORTAL_ROLES.find(r => r.key === selectedRole) || PORTAL_ROLES[0];
  const ActiveIcon = activePortalInfo.icon;

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-canvas)',
      backgroundImage: isDark
        ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.18), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(99, 102, 241, 0.12), transparent 70%)'
        : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.10), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(59, 130, 246, 0.06), transparent 70%)',
      fontFamily: 'var(--font-sans)',
      padding: '16px 20px',
      boxSizing: 'border-box',
      position: 'relative',
      transition: 'background-color 0.25s ease'
    }}>
      {/* Top Floating Theme Switcher */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 10
      }}>
        <button
          onClick={toggleTheme}
          className="btn-academic btn-secondary btn-sm"
          style={{
            borderRadius: 'var(--r-full)',
            padding: '5px 12px',
            gap: '6px',
            fontSize: '0.74rem',
            boxShadow: 'var(--shadow-xs)'
          }}
          title={isDark ? "Switch to Soft Light Mode" : "Switch to Deep Dark Mode"}
        >
          {isDark ? (
            <>
              <Sun size={14} style={{ color: '#FBBF24' }} />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={14} style={{ color: 'var(--brand-primary)' }} />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Brand Distinctive Emblem Header - Compact Fitted */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--indigo-primary) 100%)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
          boxShadow: '0 6px 18px -3px var(--brand-glow), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Building2 size={20} strokeWidth={2.2} />
        </div>

        <h1 style={{
          fontSize: '1.38rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          margin: 0,
          lineHeight: 1.2
        }}>
          Smart Campus
        </h1>

        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '3px',
          fontWeight: 500
        }}>
          Academic Resource & Laboratory Governance
        </p>
      </div>

      {/* Comforting Aesthetic Login Card - Fitted Compact */}
      <div style={{
        width: '100%',
        maxWidth: '410px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '20px 24px 18px',
        position: 'relative',
        transition: 'var(--transition-smooth)'
      }}>
        {/* Soft Role Selector Grid with Distinctive Badges */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)'
            }}>
              Select Role Gateway
            </span>

            <span style={{
              fontSize: '0.70rem',
              color: 'var(--brand-primary)',
              fontWeight: 700
            }}>
              {selectedRole}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px'
          }}>
            {PORTAL_ROLES.map(({ key, label, icon: Icon, badgeClass }) => {
              const isSelected = selectedRole === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePortalChange(key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 4px',
                    borderRadius: 'var(--r-md)',
                    border: isSelected 
                      ? '1px solid var(--brand-primary)' 
                      : '1px solid var(--card-border)',
                    backgroundColor: isSelected 
                      ? 'var(--brand-light)' 
                      : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div className={`icon-badge ${badgeClass}`} style={{ width: '24px', height: '24px', borderRadius: '6px' }}>
                    <Icon size={13} strokeWidth={2.2} />
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-body)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.1
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--error-text)',
            fontSize: '0.74rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pure Form */}
        <form onSubmit={handleSubmit}>
          {/* Institutional Email */}
          <div className="form-group-academic" style={{ marginBottom: '10px' }}>
            <label className="form-label-academic" style={{ marginBottom: '4px', fontSize: '0.74rem' }}>
              <span>Institutional Email</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 400 }}>@campus.edu</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email"
                required
                placeholder="name@campus.edu"
                className="form-input-academic"
                style={{ paddingLeft: '34px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', fontSize: '0.82rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail 
                size={14} 
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group-academic" style={{ marginBottom: '8px' }}>
            <div className="form-label-academic" style={{ marginBottom: '4px', fontSize: '0.74rem' }}>
              <span>Password</span>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '0.70rem',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="form-input-academic"
                style={{ paddingLeft: '34px', paddingRight: '34px', paddingTop: '7px', paddingBottom: '7px', fontSize: '0.82rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock 
                size={14} 
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)',
                  pointerEvents: 'none'
                }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Remember Session & Encryption Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '10px 0 14px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
              />
              <span>Remember session</span>
            </label>

            <span style={{
              fontSize: '0.70rem',
              color: 'var(--brand-primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={12} />
              <span>TLS Secured</span>
            </span>
          </div>

          {/* Pure Button Action */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-academic btn-primary"
            style={{ width: '100%', padding: '9px 16px', fontSize: '0.84rem' }}
          >
            <span>{isSubmitting ? 'Authenticating…' : `Sign In as ${selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}`}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Clean, Comforting Persona Quick Selector */}
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ fontWeight: 500 }}>Persona Autofill:</span>
          <select
            onChange={handlePersonaSelect}
            defaultValue=""
            className="form-select-academic"
            style={{
              width: 'auto',
              padding: '4px 8px',
              fontSize: '0.70rem',
              borderRadius: 'var(--r-md)',
              fontWeight: 600
            }}
          >
            <option value="" disabled>Select Evaluation Account</option>
            {DEMO_PERSONAS.map((p) => (
              <option key={p.email} value={p.email}>
                {p.name} ({p.role.charAt(0) + p.role.slice(1).toLowerCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subtle Institutional Footnote */}
      <div style={{
        marginTop: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.70rem',
        color: 'var(--text-subtle)',
        fontWeight: 500
      }}>
        <span>Smart Campus Academic System</span>
        <span>•</span>
        <span>3NF / BCNF Enforced</span>
        <span>•</span>
        <span>Institutional SSO</span>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <Modal 
          isOpen={showForgotModal} 
          onClose={() => setShowForgotModal(false)}
          title="Institutional Password Reset"
          maxWidth="440px"
        >
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '14px' }}>
              Institutional access recovery is supervised under Central Academic Administration rules. For demonstration and examination purposes, all sample accounts share the standard password:
            </p>
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--brand-light)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--brand-primary)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.94rem',
              marginBottom: '20px',
              textAlign: 'center',
              letterSpacing: '0.04em'
            }}>
              password123
            </div>
            <button 
              className="btn-academic btn-primary"
              style={{ width: '100%' }}
              onClick={() => setShowForgotModal(false)}
            >
              Back to Login
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
