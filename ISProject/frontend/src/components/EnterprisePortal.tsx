import { useState, useEffect } from 'react';
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
import { adminApi } from '../services/api';
import type { User } from '../App';
import type { SystemStatsData, AdminUser, APIConfigData, AuditLog } from '../types/api';

interface EnterprisePortalProps {
  user: User;
  onLogout: () => void;
}

export default function EnterprisePortal({ user, onLogout }: EnterprisePortalProps) {
  const [stats, setStats] = useState<SystemStatsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [apiConfig, setApiConfig] = useState<APIConfigData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('data-scientist');
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('data-scientist');
  const [auditLogSearch, setAuditLogSearch] = useState('');
  const [auditLogFilter, setAuditLogFilter] = useState('all');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes, configRes, logsRes] = await Promise.all([
          adminApi.getSystemStats(),
          adminApi.listUsers(),
          adminApi.getAPIConfig(),
          adminApi.getAuditLogs({ page: 1, page_size: 50 }),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (usersRes.success) setUsers(usersRes.data);
        if (configRes.success) setApiConfig(configRes.data);
        if (logsRes.success) setAuditLogs(logsRes.data.logs);
      } catch (error: any) {
        toast.error(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditUser = (userData: AdminUser) => {
    setSelectedUser(userData);
    setEditUserName(userData.name);
    setEditUserEmail(userData.email);
    setEditUserRole(userData.role);
    setEditUserDialogOpen(true);
  };

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const response = await adminApi.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
      });
      if (response.success) {
        toast.success('User added successfully!');
        setAddUserDialogOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('data-scientist');
        // Refresh users list
        const usersRes = await adminApi.listUsers();
        if (usersRes.success) setUsers(usersRes.data);
      }
    } catch (error: any) {
      toast.error(`Failed to add user: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    try {
      const response = await adminApi.updateUser(selectedUser.id, {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole,
      });
      if (response.success) {
        toast.success('User updated successfully!');
        setEditUserDialogOpen(false);
        // Refresh users list
        const usersRes = await adminApi.listUsers();
        if (usersRes.success) setUsers(usersRes.data);
      }
    } catch (error: any) {
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      const response = await adminApi.deactivateUser(userId);
      if (response.success) {
        toast.success('User deactivated successfully');
        // Refresh users list
        const usersRes = await adminApi.listUsers();
        if (usersRes.success) setUsers(usersRes.data);
      }
    } catch (error: any) {
      toast.error(`Failed to deactivate user: ${error.message}`);
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      await adminApi.exportAuditLogs();
      toast.success('Audit logs exported successfully');
    } catch (error: any) {
      toast.error(`Failed to export audit logs: ${error.message}`);
    }
  };

  const handleCopyApiKey = () => {
    const apiKey = apiConfig?.api_key_configured ? 'API_KEY_PLACEHOLDER' : 'Not configured';
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
    toast.success('API key copied to clipboard');
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
                  <p className="text-2xl">{loading ? '...' : (stats?.images_processed_today || 0).toLocaleString()}</p>
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
                  <p className="text-2xl">{loading ? '...' : (stats?.success_rate || 0).toFixed(1)}%</p>
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
                  <p className="text-2xl">{loading ? '...' : stats?.error_count || 0}</p>
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
                  <p className="text-2xl">{loading ? '...' : stats?.active_users || 0}</p>
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
                  {apiConfig && (
                    <>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm">
                        <p className="text-green-400">POST</p>
                        <p>{apiConfig.api_base_url}/predict</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <div className="flex gap-2">
                            <Input 
                              type={showApiKey ? "text" : "password"}
                              value={showApiKey ? (apiConfig.api_key_configured ? 'API_KEY_PLACEHOLDER' : 'Not configured') : 'sk_live_••••••••••••••••'} 
                              readOnly 
                            />
                            <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                              {apiKeyCopied ? '✓' : <Key className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Rate Limit</Label>
                          <Input value={`${apiConfig.rate_limit.toLocaleString()} requests/minute`} readOnly />
                        </div>
                      </div>
                    </>
                  )}

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
                  {loading ? (
                    <div className="text-center py-8">Loading API activity...</div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No API activity logs available</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.slice(0, 10).map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">{log.timestamp}</TableCell>
                            <TableCell className="font-mono text-sm">{log.action}</TableCell>
                            <TableCell className="text-sm">{log.user_email || 'System'}</TableCell>
                            <TableCell>
                              <Badge variant={log.event_type === 'api' ? 'default' : 'secondary'}>
                                {log.event_type}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
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
                {loading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
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
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                  <Button variant="outline" onClick={handleExportAuditLogs}>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Search logs..." 
                      className="flex-1"
                      value={auditLogSearch}
                      onChange={(e) => setAuditLogSearch(e.target.value)}
                    />
                    <Select value={auditLogFilter} onValueChange={setAuditLogFilter}>
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

                  {loading ? (
                    <div className="text-center py-8">Loading audit logs...</div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No audit logs available</div>
                  ) : (
                    <div className="border rounded-lg divide-y">
                      {auditLogs
                        .filter(log => {
                          if (auditLogFilter !== 'all' && log.event_type !== auditLogFilter) return false;
                          if (auditLogSearch && !log.action.toLowerCase().includes(auditLogSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((log, idx) => (
                          <div key={idx} className="p-4 flex items-start gap-4">
                            <FileText className="w-4 h-4 mt-0.5 text-slate-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">{log.timestamp}</span>
                                <Badge variant="outline" className="text-xs">{log.event_type}</Badge>
                              </div>
                              <p className="text-sm mt-1">{log.action}</p>
                              <p className="text-xs text-slate-500 mt-1">by {log.user_email || 'System'}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
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
              <Input 
                placeholder="John Doe" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                placeholder="john@company.com" 
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
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
              <Input 
                placeholder="John Doe" 
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                placeholder="john@company.com" 
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
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