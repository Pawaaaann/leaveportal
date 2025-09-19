import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, UserCheck, Settings, Plus } from "lucide-react";

export default function AdminDashboard() {
  const { userData, logout } = useAuth();
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    dept: "",
    year: "",
    hostel_status: "",
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement user creation via API
    console.log("Creating user:", newUser);
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
            <Button variant="ghost" className="w-full justify-start" data-testid="nav-overview">
              <FileText className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start" data-testid="nav-users">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <Button variant="ghost" className="w-full justify-start" data-testid="nav-leaves">
              <UserCheck className="mr-2 h-4 w-4" />
              Leave Requests
            </Button>
            <Button variant="ghost" className="w-full justify-start" data-testid="nav-settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs defaultValue="overview" className="space-y-6">
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
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">All registered users</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-pending-leaves">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-approved-leaves">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Leaves</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-rejection-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0%</div>
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
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
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
                      <div className="space-y-2">
                        <Label htmlFor="dept">Department</Label>
                        <Input
                          id="dept"
                          value={newUser.dept}
                          onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })}
                          placeholder="Enter department"
                          data-testid="input-dept"
                        />
                      </div>
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
                  <div className="text-center py-8 text-muted-foreground">
                    No users found. Create some users to get started.
                  </div>
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
                  <div className="text-center py-8 text-muted-foreground">
                    No leave requests found. Users can submit leave requests once they're created.
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