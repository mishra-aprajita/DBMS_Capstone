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
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-canvas)',
      backgroundImage: isDark
        ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.18), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(99, 102, 241, 0.12), transparent 70%)'
        : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.10), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 120%, rgba(59, 130, 246, 0.06), transparent 70%)',
      fontFamily: 'var(--font-sans)',
      padding: '32px 20px',
      position: 'relative',
      transition: 'background-color 0.25s ease'
    }}>
      {/* Top Floating Theme Switcher */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={toggleTheme}
          className="btn-academic btn-secondary btn-sm"
          style={{
            borderRadius: 'var(--r-full)',
            padding: '6px 14px',
            gap: '8px',
            fontSize: '0.78rem',
            boxShadow: 'var(--shadow-xs)'
          }}
          title={isDark ? "Switch to Soft Light Mode" : "Switch to Deep Dark Mode"}
        >
          {isDark ? (
            <>
              <Sun size={15} style={{ color: '#FBBF24' }} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} style={{ color: 'var(--brand-primary)' }} />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Brand Distinctive Emblem Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--indigo-primary) 100%)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 24px -4px var(--brand-glow), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Building2 size={26} strokeWidth={2.2} />
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          margin: 0
        }}>
          Smart Campus
        </h1>

        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          marginTop: '6px',
          fontWeight: 500
        }}>
          Academic Resource & Laboratory Governance
        </p>
      </div>

      {/* Comforting Aesthetic Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '36px 36px 30px',
        position: 'relative',
        transition: 'var(--transition-smooth)'
      }}>
        {/* Soft Role Selector Grid with Distinctive Badges */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)'
            }}>
              Select Role Gateway
            </span>

            <span style={{
              fontSize: '0.72rem',
              color: 'var(--brand-primary)',
              fontWeight: 600
            }}>
              {selectedRole}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
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
                    gap: '6px',
                    padding: '10px 6px',
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
                  <div className={`icon-badge ${badgeClass}`} style={{ width: '28px', height: '28px' }}>
                    <Icon size={15} strokeWidth={2.2} />
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-body)',
                    fontFamily: 'var(--font-sans)'
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
            padding: '12px 14px',
            backgroundColor: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--error-text)',
            fontSize: '0.78rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.5
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pure Form */}
        <form onSubmit={handleSubmit}>
          {/* Institutional Email */}
          <div className="form-group-academic">
            <label className="form-label-academic">
              <span>Institutional Email</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 400 }}>@campus.edu</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email"
                required
                placeholder="name@campus.edu"
                className="form-input-academic"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group-academic">
            <div className="form-label-academic">
              <span>Password</span>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '0.74rem',
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
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
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
                  right: '12px',
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Session & Encryption Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '18px 0 24px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
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
              fontSize: '0.72rem',
              color: 'var(--brand-primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={13} />
              <span>TLS Secured</span>
            </span>
          </div>

          {/* Pure Button Action */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-academic btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            <span>{isSubmitting ? 'Authenticating with Vault…' : `Sign In as ${selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}`}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Clean, Comforting Persona Quick Selector */}
        <div style={{
          marginTop: '26px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.76rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ fontWeight: 500 }}>Quick Persona Autofill:</span>
          <select
            onChange={handlePersonaSelect}
            defaultValue=""
            className="form-select-academic"
            style={{
              width: 'auto',
              padding: '5px 10px',
              fontSize: '0.74rem',
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
        marginTop: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.74rem',
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
