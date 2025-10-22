// ABOUTME: Authentication page with login and request access tabs
// ABOUTME: Uses new useAuthContext hook from feature-based architecture with React Query and admin-approval workflow

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext';
import { RequestAccessForm } from '@/app/features/signup-approval/components/RequestAccessForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const {
    signIn,
    isSigningIn,
    signInError,
    isSignInSuccess,
    signUp,
    isSigningUp,
    signUpError,
    isSignUpSuccess,
    isLoading,
    isAuthenticated
  } = useAuthContext();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });


  // Navigate to dashboard on successful authentication
  useEffect(() => {
    if (isSignInSuccess || isSignUpSuccess || isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isSignInSuccess, isSignUpSuccess, isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email: loginForm.email, password: loginForm.password });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-foreground">EC</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">España Creativa</h1>
          <p className="text-muted-foreground">Red de emprendedores y mentores</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Accede a tu cuenta</CardTitle>
            <CardDescription className="text-center">
              Conecta con emprendedores y mentores de confianza
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="request">Solicitar Acceso</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {signInError && (
                    <div className="text-sm text-destructive">
                      {signInError.message || 'Error al iniciar sesión'}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={isSigningIn}>
                    {isSigningIn ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Iniciar Sesión
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="request" className="mt-4">
                <RequestAccessForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  );
};

export { AuthPage };