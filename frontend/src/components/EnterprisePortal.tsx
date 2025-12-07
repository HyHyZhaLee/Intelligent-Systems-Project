import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { LogOut, Download, Plus, Settings, Activity, Users, Key, FileText, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../App';

interface EnterprisePortalProps {
  user: User;
  onLogout: () => void;
}

export default function EnterprisePortal({ user, onLogout }: EnterprisePortalProps) {
  const [activeUsers] = useState(24);
  const [processedToday] = useState(125678);
  const [successRate] = useState(99.1);
  const [errors] = useState(87);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Data Scientist', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'ML Engineer', status: 'Active' },
    { id: 3, name: 'Bob Wilson', email: 'bob@company.com', role: 'Analyst', status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@company.com', role: 'Data Scientist', status: 'Active' },
  ];

  const mockApiLogs = [
    { timestamp: '2025-11-03 14:32:15', endpoint: '/predict', status: 200, responseTime: '45ms', images: 1 },
    { timestamp: '2025-11-03 14:31:58', endpoint: '/batch', status: 200, responseTime: '2.3s', images: 50 },
    { timestamp: '2025-11-03 14:30:42', endpoint: '/predict', status: 200, responseTime: '38ms', images: 1 },
    { timestamp: '2025-11-03 14:28:19', endpoint: '/predict', status: 500, responseTime: '12ms', images: 1 },
    { timestamp: '2025-11-03 14:25:33', endpoint: '/batch', status: 200, responseTime: '1.8s', images: 25 },
  ];

  const handleEditUser = (userData: typeof mockUsers[0]) => {
    setSelectedUser(userData);
    setEditUserDialogOpen(true);
  };

  const handleAddUser = () => {
    setAddUserDialogOpen(false);
    toast.success('User added successfully!');
  };

  const handleSaveChanges = () => {
    setEditUserDialogOpen(false);
    toast.success('User updated successfully!');
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('YOUR_API_KEY');
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl">Enterprise Dashboard</h1>
            <p className="text-slate-600">Organization Admin Portal</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Today's Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Processed Today</p>
                  <p className="text-2xl">{processedToday.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Success Rate</p>
                  <p className="text-2xl">{successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600">✕</span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Errors</p>
                  <p className="text-2xl">{errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Active Users</p>
                  <p className="text-2xl">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">System Integration</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* API Integration Tab */}
          <TabsContent value="api">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>REST API endpoints for digit recognition</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm">
                    <p className="text-green-400">POST</p>
                    <p>https://api.ocr.com/predict</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input 
                          type={showApiKey ? "text" : "password"}
                          value={showApiKey ? 'YOUR_API_KEY' : 'sk_live_••••••••••••••••'} 
                          readOnly 
                        />
                        <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Rate Limit</Label>
                      <Input value="10,000 requests/minute" readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Batch Upload</Label>
                    <p className="text-sm text-slate-600">Max 50,000 images per job</p>
                    <Button variant="outline" className="w-full" onClick={() => setBatchDialogOpen(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Batch Processing
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent API Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Images</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockApiLogs.map((log, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">{log.timestamp}</TableCell>
                          <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === 200 ? 'default' : 'destructive'}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.responseTime}</TableCell>
                          <TableCell className="text-sm">{log.images}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage team access and roles</CardDescription>
                  </div>
                  <Button onClick={() => setAddUserDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Select defaultValue={user.role.toLowerCase().replace(' ', '-')}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data-scientist">Data Scientist</SelectItem>
                              <SelectItem value="ml-engineer">ML Engineer</SelectItem>
                              <SelectItem value="analyst">Analyst</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Audit Trail</CardTitle>
                    <CardDescription>Complete system activity log</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Search logs..." className="flex-1" />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="api">API Calls</SelectItem>
                        <SelectItem value="user">User Actions</SelectItem>
                        <SelectItem value="system">System Events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg divide-y">
                    {[
                      { time: '14:32:15', user: 'john@company.com', action: 'Uploaded 50 images via batch API', type: 'API' },
                      { time: '14:28:42', user: 'admin@company.com', action: 'Updated user role: jane@company.com', type: 'User' },
                      { time: '14:15:33', user: 'system', action: 'Model retrained with new dataset', type: 'System' },
                      { time: '13:58:21', user: 'alice@company.com', action: 'Exported model weights (.pkl)', type: 'API' },
                      { time: '13:42:19', user: 'bob@company.com', action: 'Viewed confusion matrix', type: 'User' },
                    ].map((log, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-4">
                        <FileText className="w-4 h-4 mt-0.5 text-slate-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">{log.time}</span>
                            <Badge variant="outline" className="text-xs">{log.type}</Badge>
                          </div>
                          <p className="text-sm mt-1">{log.action}</p>
                          <p className="text-xs text-slate-500 mt-1">by {log.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Batch Processing Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Batch Processing</DialogTitle>
            <DialogDescription>
              Set up batch processing parameters for your API calls.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Max Images per Job</Label>
              <Input value="50,000" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Rate Limit</Label>
              <Input value="10,000 requests/minute" readOnly />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setBatchDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Add a new user to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="john@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="data-scientist">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-scientist">Data Scientist</SelectItem>
                  <SelectItem value="ml-engineer">ML Engineer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setAddUserDialogOpen(false)}>
              Close
            </Button>
            <Button type="submit" onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="John Doe" value={selectedUser?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="john@company.com" value={selectedUser?.email || ''} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue={selectedUser?.role.toLowerCase().replace(' ', '-') || 'data-scientist'}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-scientist">Data Scientist</SelectItem>
                  <SelectItem value="ml-engineer">ML Engineer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setEditUserDialogOpen(false)}>
              Close
            </Button>
            <Button type="submit" onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}