import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSessionCodeFromLocation, removeSessionCodeFromUrl } from '@/lib/injastAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InjastCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithInjast, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // Extract session code from URL
    const sessionCode = getSessionCodeFromLocation();
    
    if (!sessionCode) {
      setError('کد جلسه یافت نشد. لطفاً دوباره تلاش کنید.');
      setIsLoading(false);
      return;
    }

    // Process the SSO callback
    const processCallback = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Exchange session code for tokens
        await loginWithInjast(sessionCode);
        
        // Remove session code from URL
        removeSessionCodeFromUrl();
        
        toast.success('ورود با موفقیت انجام شد');
        
        // Redirect to home page
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect, { replace: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطا در احراز هویت Injast';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      }
    };

    processCallback();
  }, [loginWithInjast, navigate, searchParams, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-right">در حال احراز هویت...</CardTitle>
            <CardDescription className="text-right">
              لطفاً صبر کنید، در حال اتصال به Injast هستیم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-right text-destructive">خطا در احراز هویت</CardTitle>
            <CardDescription className="text-right">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              بازگشت به صفحه ورود
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}




