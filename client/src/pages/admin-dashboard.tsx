import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, UserCheck, Settings, Plus, Loader2 } from "lucide-react";
import { User } from "@shared/schema";

// Department options for dropdowns
const DEPARTMENTS = [
  "Computer Science",
  "Information Technology", 
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Mathematics",
  "Physics",
  "Chemistry"
];

// Year options for dropdowns
const YEARS = [
  "1st Year",
  "2nd Year", 
  "3rd Year",
  "4th Year"
];

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    dept: "",
    year: "",
    hostel_status: "",
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch all leave requests for admin overview
  const { data: allLeaveRequests = [], isLoading: leaveRequestsLoading } = useQuery<any[]>({
    queryKey: ["/api/leave-requests/all"],
  });

  // Approve/Reject leave request mutation
  const approveRejectMutation = useMutation({
    mutationFn: async ({ id, action, comments }: { id: string; action: string; comments?: string }) => {
      return await apiRequest("POST", `/api/leave-requests/${id}/approve`, { action, comments });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/all"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update leave request",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      // Reset form
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "",
        dept: "",
        year: "",
        hostel_status: "",
      });
      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.role) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }
    
    // Validate Mentor-specific fields
    if (newUser.role === "Mentor") {
      if (!newUser.dept) {
        toast({
          title: "Error",
          description: "Please select a department for Mentor role",
          variant: "destructive",
        });
        return;
      }
      if (!newUser.year) {
        toast({
          title: "Error", 
          description: "Please select a year for Mentor role",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validate HOD department requirement
    if (newUser.role === "HOD" && !newUser.dept) {
      toast({
        title: "Error",
        description: "Please select a department for HOD role",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(newUser);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">College Leave Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" data-testid="badge-admin">Admin</Badge>
            <span className="text-sm">{userData?.name}</span>
            <Button variant="outline" onClick={logout} data-testid="button-logout">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r bg-card p-4">
          <div className="space-y-2">
            <Button 
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start" 
              data-testid="nav-overview"
              onClick={() => setActiveTab("overview")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start" 
              data-testid="nav-users"
              onClick={() => setActiveTab("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <Button 
              variant={activeTab === "leaves" ? "default" : "ghost"}
              className="w-full justify-start" 
              data-testid="nav-leaves"
              onClick={() => setActiveTab("leaves")}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Leave Requests
            </Button>
            <Button 
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start" 
              data-testid="nav-settings"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
              <TabsTrigger value="leaves" data-testid="tab-leaves">Leave Requests</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card data-testid="card-total-users">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-xs text-muted-foreground">All registered users</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-pending-leaves">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allLeaveRequests.filter(req => req.status === 'pending').length}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-approved-leaves">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Leaves</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allLeaveRequests.filter(req => req.status === 'approved').length}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-rejection-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {allLeaveRequests.length > 0 
                        ? Math.round((allLeaveRequests.filter(req => req.status === 'rejected').length / allLeaveRequests.length) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card data-testid="card-create-user">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New User
                  </CardTitle>
                  <CardDescription>
                    Add mentors, HODs, principals, and wardens. Students can register themselves.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Enter full name"
                          required
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="Enter email address"
                          required
                          data-testid="input-user-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Enter password"
                          required
                          data-testid="input-user-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUser.role || undefined} onValueChange={(value) => {
                          const updatedUser = { ...newUser, role: value };
                          // Clear year if role is not Mentor
                          if (value !== "Mentor") {
                            updatedUser.year = "";
                          }
                          // Clear dept if role doesn't need department
                          if (value !== "Mentor" && value !== "HOD") {
                            updatedUser.dept = "";
                          }
                          setNewUser(updatedUser);
                        }}>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mentor">Mentor</SelectItem>
                            <SelectItem value="HOD">HOD</SelectItem>
                            <SelectItem value="Principal">Principal</SelectItem>
                            <SelectItem value="Warden">Warden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Department field for Mentor and HOD roles */}
                      {(newUser.role === "Mentor" || newUser.role === "HOD") && (
                        <div className="space-y-2">
                          <Label htmlFor="dept">Department</Label>
                          <Select value={newUser.dept || undefined} onValueChange={(value) => setNewUser({ ...newUser, dept: value })}>
                            <SelectTrigger data-testid="select-dept">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {/* Year field only for Mentor role */}
                      {newUser.role === "Mentor" && (
                        <div className="space-y-2">
                          <Label htmlFor="year">Year</Label>
                          <Select value={newUser.year || undefined} onValueChange={(value) => setNewUser({ ...newUser, year: value })}>
                            <SelectTrigger data-testid="select-year">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS.map((year) => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="w-full" data-testid="button-create-user">
                      Create User
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* User List */}
              <Card data-testid="card-user-list">
                <CardHeader>
                  <CardTitle>Existing Users</CardTitle>
                  <CardDescription>Manage all system users</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found. Create some users to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.dept || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leave Requests Tab */}
            <TabsContent value="leaves" className="space-y-6">
              <Card data-testid="card-leave-overview">
                <CardHeader>
                  <CardTitle>Leave Request Overview</CardTitle>
                  <CardDescription>Monitor all leave requests across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveRequestsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading leave requests...</span>
                    </div>
                  ) : allLeaveRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leave requests found. Users can submit leave requests once they're created.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Current Stage</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allLeaveRequests.map((request) => (
                          <TableRow key={request.id} data-testid={`row-leave-${request.id}`}>
                            <TableCell className="font-medium">{request.student_id}</TableCell>
                            <TableCell>{request.reason}</TableCell>
                            <TableCell>{request.start_date}</TableCell>
                            <TableCell>{request.end_date}</TableCell>
                            <TableCell>
                              <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{request.approver_stage}</TableCell>
                            <TableCell>
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-600"
                                    onClick={() => approveRejectMutation.mutate({ id: request.id, action: 'approve' })}
                                    disabled={approveRejectMutation.isPending}
                                    data-testid={`button-approve-${request.id}`}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600"
                                    onClick={() => approveRejectMutation.mutate({ id: request.id, action: 'reject' })}
                                    disabled={approveRejectMutation.isPending}
                                    data-testid={`button-reject-${request.id}`}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card data-testid="card-settings">
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system preferences and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">General Settings</h3>
                      <div className="space-y-2">
                        <Label>System Timezone</Label>
                        <Select defaultValue="UTC">
                          <SelectTrigger data-testid="select-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Leave Management</h3>
                      <div className="space-y-2">
                        <Label>Default Leave Duration (days)</Label>
                        <Input type="number" defaultValue="7" data-testid="input-leave-duration" />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Leave Duration (days)</Label>
                        <Input type="number" defaultValue="30" data-testid="input-max-leave" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notifications</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="email-notifications" defaultChecked />
                          <Label htmlFor="email-notifications">Enable email notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="sms-notifications" />
                          <Label htmlFor="sms-notifications">Enable SMS notifications</Label>
                        </div>
                      </div>
                    </div>

                    <Button data-testid="button-save-settings">Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}