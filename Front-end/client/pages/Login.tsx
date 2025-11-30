import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { isInjastSessionCode, getSessionCodeFromLocation } from "@/lib/injastAuth";

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithInjast, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isInjastLoading, setIsInjastLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Auto-detect and handle Injast session code
  useEffect(() => {
    if (isAuthenticated || isLoading || isInjastLoading) {
      return;
    }

    if (isInjastSessionCode(window.location.href)) {
      const sessionCode = getSessionCodeFromLocation();
      if (sessionCode) {
        handleInjastLogin(sessionCode);
      }
    }
  }, [isAuthenticated, isLoading, isInjastLoading]);

  const handleInjastLogin = async (sessionCode: string) => {
    setIsInjastLoading(true);
    try {
      await loginWithInjast(sessionCode);
      toast.success('ورود با موفقیت انجام شد');
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ورود به سیستم');
      // Redirect to callback page to show error
      navigate(`/auth/injast/callback?session_code=${sessionCode}`, { replace: true });
    } finally {
      setIsInjastLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('ورود با موفقیت انجام شد');
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ورود به سیستم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-right">ورود به سیستم</CardTitle>
          <CardDescription className="text-right">
            برای رزرو اقامتگاه وارد حساب کاربری خود شوید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right">نام کاربری</Label>
              <Input
                id="username"
                type="text"
                {...register('username', { required: 'نام کاربری الزامی است' })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive text-right">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                {...register('password', { required: 'رمز عبور الزامی است' })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive text-right">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isInjastLoading}>
              {isLoading ? 'در حال ورود...' : 'ورود'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">یا</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading || isInjastLoading}
              onClick={() => {
                // In a real implementation, this would redirect to Injast SuperApp
                // For now, we'll show a message that Injast SSO should be initiated from the SuperApp
                toast.info('برای ورود با Injast، لطفاً از اپلیکیشن Injast استفاده کنید');
              }}
            >
              {isInjastLoading ? 'در حال اتصال به Injast...' : 'ورود با Injast'}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              حساب کاربری ندارید؟{' '}
              <Link to="/signup" className="text-primary hover:underline">
                ثبت نام
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

