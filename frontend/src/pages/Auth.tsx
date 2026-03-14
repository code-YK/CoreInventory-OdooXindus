import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Package } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState<'idle' | 'email' | 'otp'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.login(email, password);
    setLoading(false);
    navigate('/dashboard');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.signup(email, password, name);
    setLoading(false);
    navigate('/dashboard');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.requestOtp(otpEmail);
    setLoading(false);
    setForgotMode('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.verifyOtp(otpEmail, otp.join(''));
    setLoading(false);
    setForgotMode('idle');
    setTab('login');
  };

  const handleOtpChange = (i: number, v: string) => {
    if (v.length > 1) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  if (forgotMode !== 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, hsl(0 68% 60%), transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, hsl(0 68% 60%), transparent)' }} />
        </div>
        <div className="w-full max-w-[400px] gradient-card border-glow rounded-2xl p-8 surface-elevated animate-scale-in relative z-10">
          <h1 className="text-xl font-bold mb-1 text-foreground">Reset Password</h1>
          {forgotMode === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Enter your email to receive a 6-digit OTP.</p>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input value={otpEmail} onChange={e => setOtpEmail(e.target.value)} type="email" required className="bg-surface border-border h-11 rounded-xl" />
              </div>
              <Button type="submit" className="w-full btn-press h-11 rounded-xl gradient-primary border-0 font-semibold" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</Button>
              <button type="button" onClick={() => setForgotMode('idle')} className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors">Back to login</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-mono text-foreground">{otpEmail}</span></p>
              <div className="flex gap-2.5 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    maxLength={1}
                    className="w-11 h-14 text-center text-2xl font-mono bg-surface border border-border rounded-xl text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                  />
                ))}
              </div>
              <Button type="submit" className="w-full btn-press h-11 rounded-xl gradient-primary border-0 font-semibold" disabled={loading || otp.some(d => !d)}>{loading ? 'Verifying...' : 'Verify OTP'}</Button>
              <button type="button" onClick={() => setForgotMode('email')} className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors">Resend code</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, hsl(0 68% 60%), transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, hsl(0 68% 60%), transparent)' }} />
      </div>
      
      <div className="w-full max-w-[400px] gradient-card border-glow rounded-2xl p-8 surface-elevated animate-scale-in relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-lg glow-primary">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-lg text-foreground">CoreInventory</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Warehouse Management System</p>
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full bg-muted/50 rounded-xl h-11">
            <TabsTrigger value="login" className="flex-1 rounded-xl text-xs uppercase tracking-wider font-semibold data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">Login</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1 rounded-xl text-xs uppercase tracking-wider font-semibold data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-surface border-border h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="bg-surface border-border h-11 rounded-xl" />
              </div>
              <Button type="submit" className="w-full btn-press h-11 rounded-xl gradient-primary border-0 font-semibold shadow-lg" disabled={loading}>{loading ? 'Authenticating...' : 'Login'}</Button>
              <button type="button" onClick={() => { setForgotMode('email'); setOtpEmail(email); }} className="text-xs text-muted-foreground hover:text-primary w-full text-center transition-colors">Forgot password?</button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4 mt-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required className="bg-surface border-border h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-surface border-border h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="bg-surface border-border h-11 rounded-xl" />
              </div>
              <Button type="submit" className="w-full btn-press h-11 rounded-xl gradient-primary border-0 font-semibold shadow-lg" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
