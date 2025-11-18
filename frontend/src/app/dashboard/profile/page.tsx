"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, Lock, Mail, Shield, Calendar, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Password change with OTP
  const [step, setStep] = useState<"request" | "verify">("request");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/auth/request-password-change-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setMaskedEmail(data.email);
      setStep("verify");
      setMessage({ type: "success", text: "OTP sent to your email address!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate OTP
    if (otp.length !== 6) {
      setMessage({ type: "error", text: "OTP must be 6 digits" });
      return;
    }

    // Validate passwords
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/auth/change-password-with-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setMessage({ type: "success", text: "Password changed successfully!" });
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("request");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to change password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile and security settings</p>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "info"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "password"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
              </div>
            </button>
          </div>

          {/* Profile Information Tab */}
          {activeTab === "info" && (
            <div className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-border">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{user?.name}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="text-foreground">{user?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="text-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Shield className="w-4 h-4" />
                      Role
                    </label>
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user?.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </label>
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="text-foreground">{formatDate(user?.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      <strong>Note:</strong> To update your profile information, please contact your administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <div className="p-8">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Change Your Password with OTP
                </h2>

                {message && (
                  <div
                    className={`mb-6 p-4 rounded-lg border ${
                      message.type === "success"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {step === "request" ? (
                  <form onSubmit={handleRequestOTP} className="space-y-6">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-foreground">How it works</h3>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p>We will send a 6-digit verification code to your registered email address ({user?.email}). You will need to enter this code to change your password.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isLoading ? "Sending OTP..." : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-foreground">OTP Sent!</h3>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p>A 6-digit verification code has been sent to <strong>{maskedEmail}</strong></p>
                            <p className="mt-1">The code will expire in 10 minutes.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 pr-10 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Must be at least 6 characters long
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 pr-10 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isLoading ? "Changing Password..." : "Change Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("request");
                          setOtp("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setMessage(null);
                        }}
                        className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                      >
                        Back
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        disabled={isLoading}
                        className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                      >
                        Didn&apos;t receive the code? Resend OTP
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Security Tip:</strong> Choose a strong password that you don&apos;t use on other websites.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
