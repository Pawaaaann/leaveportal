import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    role: userData?.role || "",
    dept: userData?.dept || "",
    year: userData?.year || "",
    register_number: userData?.register_number || "",
    hostel_status: userData?.hostel_status || "",
    mentor_id: userData?.mentor_id || "",
    profile_pic_url: userData?.profile_pic_url || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return apiRequest("PUT", `/api/users/${userData?.id}`, updatedData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      // Invalidate user queries to refresh auth context
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: "Failed to update profile",
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    },
  });

  const handleSave = async () => {
    if (!userData?.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for update (exclude email and role since they shouldn't be editable)
    const updatedData = {
      name: formData.name,
      dept: formData.dept || undefined,
      year: formData.year || undefined,
      register_number: formData.register_number || undefined,
      hostel_status: formData.hostel_status || undefined,
      mentor_id: formData.mentor_id || undefined,
      profile_pic_url: formData.profile_pic_url || undefined,
    };

    updateProfileMutation.mutate(updatedData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  data-testid="button-edit-profile"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                {formData.profile_pic_url ? (
                  <img 
                    src={formData.profile_pic_url} 
                    alt="Profile Picture"
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      // If image fails to load, hide it and show default
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    disabled
                    data-testid="input-role"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register_number">Register Number</Label>
                  <Input
                    id="register_number"
                    value={formData.register_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, register_number: e.target.value }))}
                    disabled={!isEditing}
                    data-testid="input-register-number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Select
                    value={formData.dept}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dept: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Mechanical">Mechanical</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={formData.year}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger data-testid="select-year">
                      <SelectValue placeholder="Select year" />
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
                  <Label htmlFor="hostel_status">Hostel Status</Label>
                  <Input
                    id="hostel_status"
                    value={formData.hostel_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, hostel_status: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Hostel A - Room 205 or Day Scholar"
                    data-testid="input-hostel-status"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor_id">Mentor ID</Label>
                  <Input
                    id="mentor_id"
                    value={formData.mentor_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, mentor_id: e.target.value }))}
                    disabled={!isEditing || userData?.role === "Student"}
                    placeholder="Mentor identifier"
                    data-testid="input-mentor-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_pic_url">Profile Picture URL</Label>
                  <Input
                    id="profile_pic_url"
                    value={formData.profile_pic_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_pic_url: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter profile picture URL"
                    data-testid="input-profile-pic-url"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={updateProfileMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
