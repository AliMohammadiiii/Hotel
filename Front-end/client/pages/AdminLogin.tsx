import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { adminLogin, getAdminToken } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AdminLoginFormData {
  username: string;
  password: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>();

  // If an admin token already exists, redirect directly to the admin area.
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      const redirect = searchParams.get("redirect") || "/admin";
      navigate(redirect, { replace: true });
    }
  }, [navigate, searchParams]);

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    try {
      await adminLogin(data.username, data.password);
      // Backend already enforces is_staff for admin-login,
      // so a successful response implies a valid admin user.
      toast.success("ورود به پنل ادمین با موفقیت انجام شد");
      const redirect = searchParams.get("redirect") || "/admin";
      navigate(redirect, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ورود به پنل ادمین");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-right">ورود به پنل ادمین</CardTitle>
          <CardDescription className="text-right">
            برای مدیریت اقامتگاه‌ها وارد حساب ادمین شوید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right">
                نام کاربری
              </Label>
              <Input
                id="username"
                type="text"
                {...register("username", { required: "نام کاربری الزامی است" })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive text-right">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right">
                رمز عبور
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "رمز عبور الزامی است" })}
                className="text-right"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive text-right">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "در حال ورود..." : "ورود به پنل ادمین"}
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

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              ورود کاربر عادی
            </Link>
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


