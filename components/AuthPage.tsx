
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, KeyRound, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  onLogin: () => void;
  resetMode: boolean;
  onSetResetMode: (mode: boolean) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, resetMode, onSetResetMode }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Use Effect to handle deep-link simulation via props
  useEffect(() => {
    if (resetMode) {
      setMode('reset-password');
    }
  }, [resetMode]);

  // HELPER: Simulate Database Interaction via LocalStorage
  const getUsers = () => {
    const usersStr = localStorage.getItem('cognitutor_users');
    return usersStr ? JSON.parse(usersStr) : {};
  };

  const saveUser = (user: any) => {
    const users = getUsers();
    users[user.email] = user;
    localStorage.setItem('cognitutor_users', JSON.stringify(users));
  };

  const setActiveSession = (user: any) => {
    localStorage.setItem('cognitutor_active_user', JSON.stringify(user));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const users = getUsers();
      const user = users[email];

      if (user && user.password === password) {
        setActiveSession(user);
        onLogin();
      } else {
        setError("Invalid email or password.");
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const users = getUsers();
      if (users[email]) {
        setError("User already exists with this email.");
        setIsLoading(false);
        return;
      }

      const newUser = { email, password, name };
      saveUser(newUser);
      setActiveSession(newUser);
      onLogin();
    }, 1000);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    setTimeout(() => {
      const users = getUsers();
      if (!users[email]) {
        setError("No account found with this email.");
        setIsLoading(false);
        return;
      }

      // Simulate sending a "Magic Link"
      setSuccessMsg(`Magic Link sent to ${email}. (Simulation: Click "OK" on the alert to reset now)`);
      setIsLoading(false);
      
      // Simulate user clicking the link in email
      setTimeout(() => {
        if(window.confirm(`[DEMO: Email Simulation]\n\nA magic link was sent to ${email}.\n\nClick OK to simulate clicking the link and resetting your password.`)) {
           setMode('reset-password');
           setSuccessMsg('');
        }
      }, 500);

    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
        const users = getUsers();
        if (users[email]) {
            users[email].password = newPassword;
            localStorage.setItem('cognitutor_users', JSON.stringify(users));
            
            setSuccessMsg("Password updated successfully! Logging you in...");
            
            // Auto login
            setActiveSession(users[email]);
            
            setTimeout(() => {
                onSetResetMode(false);
                onLogin();
            }, 1500);
        } else {
            setError("Error finding account.");
            setIsLoading(false);
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <KeyRound className="text-white h-8 w-8" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          {mode === 'login' && 'Sign in to CogniTutor'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'forgot-password' && 'Reset your password'}
          {mode === 'reset-password' && 'Set new password'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {mode === 'login' ? 'Your personal AI study companion' : 
           mode === 'signup' ? 'Start learning smarter today' :
           mode === 'forgot-password' ? 'We will send you a magic link' :
           'Secure your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-800">
          
          {successMsg && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded relative flex items-center gap-2">
               <CheckCircle size={18} />
               <span className="text-sm">{successMsg}</span>
            </div>
          )}

          {error && (
             <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded relative text-sm">
                {error}
             </div>
          )}

          <form className="space-y-6" onSubmit={
            mode === 'login' ? handleLogin : 
            mode === 'signup' ? handleSignup : 
            mode === 'forgot-password' ? handleForgotPassword :
            handleResetPassword
          }>
            
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  readOnly={mode === 'reset-password'}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-white ${mode === 'reset-password' ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {mode === 'reset-password' ? 'New Password' : 'Password'}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={mode === 'reset-password' ? newPassword : password}
                    onChange={(e) => mode === 'reset-password' ? setNewPassword(e.target.value) : setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-800 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                   mode === 'login' ? 'Sign in' : 
                   mode === 'signup' ? 'Create Account' : 
                   mode === 'forgot-password' ? 'Send Magic Link' : 'Update Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
                  {mode === 'login' ? 'New to CogniTutor?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {mode === 'login' ? (
                <button
                  onClick={() => setMode('signup')}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Create an account <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setMode('login')}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
