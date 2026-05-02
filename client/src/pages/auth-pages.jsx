import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Rocket,
  Users
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input, Label, FieldError } from '@/components/ui/input';
import { apiError } from '@/lib/api';

function PasswordField({ id, autoComplete, placeholder, error, register, rules }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Label htmlFor={id}>Password</Label>

      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-10"
          {...register('password', rules)}
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <FieldError>{error}</FieldError>
    </div>
  );
}

/* LOGIN */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      await login(values.email, values.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(apiError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in and continue managing your team efficiently."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <PasswordField
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          register={register}
          rules={{ required: 'Password is required' }}
        />

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

/* SIGNUP */
export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      await signup(values.name, values.email, values.password);
      toast.success('Account created!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(apiError(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start collaborating with your team in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <PasswordField
          id="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          register={register}
          rules={{
            required: 'Password required',
            minLength: {
              value: 8,
              message: 'Minimum 8 characters'
            }
          }}
        />

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}

/* LAYOUT */
function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 text-white p-14 flex-col justify-between">

        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,white,transparent_35%)]" />

        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center">
            <CheckSquare className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">Team Task Manager</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-4">
            Workspace Platform
          </p>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            Manage projects with clarity.
          </h2>

          <p className="text-white/80 text-lg leading-relaxed">
            Organize tasks, assign work, monitor progress and keep your team aligned.
          </p>

          <div className="grid gap-4 mt-10">
            <Feature icon={Rocket} text="Fast project planning" />
            <Feature icon={Users} text="Real-time team collaboration" />
            <Feature icon={Shield} text="Secure role-based access" />
          </div>
        </div>

        <p className="text-sm text-white/60 relative z-10">
          Built with React • Express • MySQL
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center p-6 sm:p-10">

        <div className="w-full max-w-md bg-white border shadow-xl rounded-3xl p-8">

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className="font-semibold">Team Task Manager</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2 mb-8">{subtitle}</p>

          {children}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-white/90">
      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <span>{text}</span>
    </div>
  );
}
