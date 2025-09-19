import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student", // Fixed to Student
    dept: "",
    year: "",
    hostel_status: "",
  });
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  if (currentUser || isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  // Student registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      return await apiRequest("POST", "/api/users/register", userData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Registration successful! You can now log in.",
      });
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "Student",
        dept: "",
        year: "",
        hostel_status: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dept || !formData.year) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="register-page">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Student Registration</CardTitle>
          <CardDescription>College Leave Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your college email"
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept">Department *</Label>
                <Select value={formData.dept} onValueChange={(value) => setFormData({ ...formData, dept: value })}>
                  <SelectTrigger data-testid="select-dept">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Electronics">Electronics & Communication</SelectItem>
                    <SelectItem value="Mechanical">Mechanical Engineering</SelectItem>
                    <SelectItem value="Civil">Civil Engineering</SelectItem>
                    <SelectItem value="Electrical">Electrical Engineering</SelectItem>
                    <SelectItem value="Chemical">Chemical Engineering</SelectItem>
                    <SelectItem value="Biotechnology">Biotechnology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hostel">Hostel Status</Label>
                <Select 
                  value={formData.hostel_status} 
                  onValueChange={(value) => setFormData({ ...formData, hostel_status: value })}
                >
                  <SelectTrigger data-testid="select-hostel">
                    <SelectValue placeholder="Are you a hostel student?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hostel">Hostel Student</SelectItem>
                    <SelectItem value="Day Scholar">Day Scholar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Student Account"
                )}
              </Button>
              
              <div className="text-center">
                <Link href="/login">
                  <Button variant="ghost" className="inline-flex items-center" data-testid="link-login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}