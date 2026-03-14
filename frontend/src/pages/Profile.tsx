import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { UserProfile } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/ThemeProvider';
import { LogOut, KeyRound, Sun, Moon, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [otpStep, setOtpStep] = useState<'idle' | 'otp' | 'newpass'>('idle');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => { api.getProfile().then(setProfile); }, []);

  const handleRequestOtp = async () => {
    if (!profile) return;
    setLoading(true);
    await api.requestOtp(profile.email);
    setLoading(false);
    setOtpStep('otp');
    toast({ title: 'OTP Sent', description: `A 6-digit code was sent to ${profile.email}` });
  };

  const handleOtpChange = (i: number, v: string) => {
    if (v.length > 1) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) {
      document.getElementById(`profile-otp-${i + 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (!profile) return;
    setLoading(true);
    await api.verifyOtp(profile.email, otp.join(''));
    setLoading(false);
    setOtpStep('newpass');
    toast({ title: 'OTP Verified', description: 'Now set your new password.' });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    // Mock password change
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setOtpStep('idle');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
  };

  if (!profile) return <Layout><div className="p-6 text-muted-foreground font-mono">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-lg">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account settings</p>
        </div>

        {/* Profile Card */}
        <div className="gradient-card border-glow rounded-xl p-6 space-y-6 surface-glow animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-primary">
              <span className="text-primary-foreground font-bold text-lg font-mono">{profile.avatar}</span>
            </div>
            <div>
              <h2 className="font-bold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.role}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between py-2.5 border-b border-border/50">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono text-xs">{profile.email}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border/50">
              <span className="text-muted-foreground">Last Login</span>
              <span className="font-mono text-xs">{new Date(profile.lastLogin).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Theme Toggle Card */}
        <div className="gradient-card border-glow rounded-xl p-5 surface-glow animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-stock-warning" />}
              <div>
                <p className="text-sm font-medium">Appearance</p>
                <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'} is active</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors duration-300 btn-press',
                theme === 'dark' ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow-sm transition-transform duration-300',
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="gradient-card border-glow rounded-xl p-5 space-y-4 surface-glow animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          {otpStep === 'idle' && (
            <Button variant="outline" className="w-full btn-press gap-2" onClick={handleRequestOtp} disabled={loading}>
              <KeyRound className="h-4 w-4" /> {loading ? 'Sending OTP...' : 'Change Password via OTP'}
            </Button>
          )}

          {otpStep === 'otp' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => { setOtpStep('idle'); setOtp(['','','','','','']); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-sm font-medium">Enter 6-digit OTP</p>
              </div>
              <p className="text-xs text-muted-foreground">Code sent to <span className="font-mono text-foreground">{profile.email}</span></p>
              <div className="flex gap-2 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`profile-otp-${i}`}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    maxLength={1}
                    className="w-10 h-12 text-center text-xl font-mono bg-surface border border-border rounded-xl text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                  />
                ))}
              </div>
              <Button className="w-full btn-press gradient-primary border-0" onClick={handleVerifyOtp} disabled={loading || otp.some(d => !d)}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          )}

          {otpStep === 'newpass' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-stock-healthy" />
                <p className="text-sm font-medium">Set New Password</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-surface border-border h-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-surface border-border h-10 rounded-xl" />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-stock-critical">Passwords do not match</p>
              )}
              <Button className="w-full btn-press gradient-primary border-0" onClick={handleChangePassword} disabled={loading || !newPassword || !confirmPassword}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <Button variant="outline" className="w-full btn-press gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => navigate('/')}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
}
