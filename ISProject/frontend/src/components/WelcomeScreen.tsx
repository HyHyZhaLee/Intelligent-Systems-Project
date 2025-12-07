import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserCircle, Brain, Building2 } from 'lucide-react';
import type { UserRole } from '../App';

interface WelcomeScreenProps {
  onRoleSelect: (role: UserRole) => void;
  onLogin: (email: string, password: string, role: UserRole) => void;
}

export default function WelcomeScreen({ onRoleSelect, onLogin }: WelcomeScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('guest');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // If guest role is selected, go directly without credentials
    if (selectedRole === 'guest') {
      onRoleSelect('guest');
      return;
    }
    
    // For other roles, require login
    if (email && password) {
      onLogin(email, password, selectedRole);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center space-y-2 pb-8">
          <CardTitle className="text-4xl">Handwritten Digit OCR System</CardTitle>
          <CardDescription className="text-lg">
            SVM-based Recognition Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Role Selection Cards */}
          <div>
            <h3 className="mb-4 text-center text-slate-600">Select Your Access Level</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedRole === 'guest'
                    ? 'border-2 border-blue-500 shadow-lg bg-blue-50'
                    : 'border-2 border-slate-200 hover:shadow-lg hover:border-blue-300'
                }`}
                onClick={() => setSelectedRole('guest')}
              >
                <CardContent className="pt-6 text-center space-y-3">
                  <UserCircle className="w-12 h-12 mx-auto text-blue-600" />
                  <div>
                    <h4>End User</h4>
                    <p className="text-sm text-slate-500">(Guest)</p>
                  </div>
                  <p className="text-xs text-slate-600">Upload images for digit recognition</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  selectedRole === 'data-scientist'
                    ? 'border-2 border-purple-500 shadow-lg bg-purple-50'
                    : 'border-2 border-slate-200 hover:shadow-lg hover:border-purple-300'
                }`}
                onClick={() => setSelectedRole('data-scientist')}
              >
                <CardContent className="pt-6 text-center space-y-3">
                  <Brain className="w-12 h-12 mx-auto text-purple-600" />
                  <div>
                    <h4>Data Scientist</h4>
                    <p className="text-sm text-slate-500">(Advanced)</p>
                  </div>
                  <p className="text-xs text-slate-600">Model analysis and tuning</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  selectedRole === 'enterprise'
                    ? 'border-2 border-emerald-500 shadow-lg bg-emerald-50'
                    : 'border-2 border-slate-200 hover:shadow-lg hover:border-emerald-300'
                }`}
                onClick={() => setSelectedRole('enterprise')}
              >
                <CardContent className="pt-6 text-center space-y-3">
                  <Building2 className="w-12 h-12 mx-auto text-emerald-600" />
                  <div>
                    <h4>Organization</h4>
                    <p className="text-sm text-slate-500">(Admin)</p>
                  </div>
                  <p className="text-xs text-slate-600">System management & API</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto">
            {selectedRole === 'guest' ? (
              <div className="text-center space-y-4">
                <p className="text-slate-600">Guest access - no login required</p>
                <Button onClick={handleSubmit} className="w-full" size="lg">
                  Continue as Guest
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <Button type="submit">Sign In</Button>
                    </div>
                  </div>
                </form>

                <p className="text-sm text-center mt-4 text-slate-600">
                  No account? → <span className="text-blue-600">Contact Admin to create</span>
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500 pt-4 border-t">
            <p>Language: English (Default)</p>
            <p className="mt-2">© 2025 Team ML – SVM-based Digit Recognition</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
