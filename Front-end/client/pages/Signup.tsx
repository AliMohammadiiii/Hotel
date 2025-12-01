import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SignupFormData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>();

  const password = watch("password");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup({
        username: data.username,
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
      });
      toast.success('ثبت نام با موفقیت انجام شد');
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ثبت نام');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-right">ثبت نام</CardTitle>
          <CardDescription className="text-right">
            حساب کاربری جدید ایجاد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right">نام کاربری *</Label>
              <Input
                id="username"
                type="text"
                {...register('username', { 
                  required: 'نام کاربری الزامی است',
                  minLength: {
                    value: 3,
                    message: 'نام کاربری باید حداقل ۳ کاراکتر باشد'
                  }
                })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive text-right">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">ایمیل *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'ایمیل الزامی است',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'ایمیل معتبر وارد کنید'
                  }
                })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive text-right">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-right">نام</Label>
                <Input
                  id="first_name"
                  type="text"
                  {...register('first_name')}
                  className="text-right"
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive text-right">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-right">نام خانوادگی</Label>
                <Input
                  id="last_name"
                  type="text"
                  {...register('last_name')}
                  className="text-right"
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive text-right">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right">رمز عبور *</Label>
              <Input
                id="password"
                type="password"
                {...register('password', { 
                  required: 'رمز عبور الزامی است',
                  minLength: {
                    value: 8,
                    message: 'رمز عبور باید حداقل ۸ کاراکتر باشد'
                  }
                })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive text-right">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirm" className="text-right">تکرار رمز عبور *</Label>
              <Input
                id="password_confirm"
                type="password"
                {...register('password_confirm', { 
                  required: 'تکرار رمز عبور الزامی است',
                  validate: (value) => 
                    value === password || 'رمزهای عبور با یکدیگر مطابقت ندارند'
                })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.password_confirm && (
                <p className="text-sm text-destructive text-right">{errors.password_confirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'در حال ثبت نام...' : 'ثبت نام'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              قبلاً حساب کاربری دارید؟{' '}
              <Link to="/login" className="text-primary hover:underline">
                ورود
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




