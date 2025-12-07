import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { LogOut, Download, Settings, BarChart3, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User } from '../App';
import React from 'react';

interface DataScientistDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function DataScientistDashboard({ user, onLogout }: DataScientistDashboardProps) {
  const [model, setModel] = useState('SVM');
  const [compareModelsDialogOpen, setCompareModelsDialogOpen] = useState(false);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const metrics = {
    accuracy: 98.5,
    precision: 0.986,
    recall: 0.982,
    f1Score: 0.984,
  };

  const confusionMatrix = [
    [972, 1, 2, 0, 1, 2, 3, 1, 0, 0],
    [0, 1125, 3, 1, 0, 1, 2, 1, 2, 0],
    [5, 2, 1010, 3, 2, 0, 3, 5, 2, 0],
    [0, 1, 4, 995, 0, 6, 0, 3, 1, 0],
    [1, 0, 3, 0, 970, 1, 2, 1, 2, 2],
    [2, 1, 0, 8, 1, 872, 3, 1, 3, 1],
    [4, 2, 1, 0, 3, 4, 942, 0, 2, 0],
    [1, 3, 5, 2, 1, 0, 0, 1010, 1, 5],
    [3, 1, 4, 6, 2, 4, 2, 3, 947, 2],
    [2, 2, 1, 4, 5, 3, 0, 8, 2, 982],
  ];

  const rocData = [
    { fpr: 0.0, tpr: 0.0, random: 0.0, digit0: 0.0, digit1: 0.0, digit5: 0.0, digit8: 0.0, microAvg: 0.0, macroAvg: 0.0 },
    { fpr: 0.001, tpr: 0.001, random: 0.001, digit0: 0.62, digit1: 0.58, digit5: 0.45, digit8: 0.38, microAvg: 0.53, macroAvg: 0.51 },
    { fpr: 0.002, tpr: 0.002, random: 0.002, digit0: 0.74, digit1: 0.70, digit5: 0.58, digit8: 0.51, microAvg: 0.66, macroAvg: 0.63 },
    { fpr: 0.003, tpr: 0.003, random: 0.003, digit0: 0.81, digit1: 0.78, digit5: 0.66, digit8: 0.60, microAvg: 0.74, macroAvg: 0.71 },
    { fpr: 0.005, tpr: 0.005, random: 0.005, digit0: 0.88, digit1: 0.85, digit5: 0.75, digit8: 0.69, microAvg: 0.81, macroAvg: 0.79 },
    { fpr: 0.008, tpr: 0.008, random: 0.008, digit0: 0.92, digit1: 0.90, digit5: 0.82, digit8: 0.77, microAvg: 0.87, macroAvg: 0.85 },
    { fpr: 0.01, tpr: 0.01, random: 0.01, digit0: 0.94, digit1: 0.92, digit5: 0.86, digit8: 0.81, microAvg: 0.90, macroAvg: 0.88 },
    { fpr: 0.02, tpr: 0.02, random: 0.02, digit0: 0.97, digit1: 0.96, digit5: 0.91, digit8: 0.88, microAvg: 0.94, macroAvg: 0.93 },
    { fpr: 0.03, tpr: 0.03, random: 0.03, digit0: 0.983, digit1: 0.975, digit5: 0.94, digit8: 0.91, microAvg: 0.96, macroAvg: 0.95 },
    { fpr: 0.05, tpr: 0.05, random: 0.05, digit0: 0.992, digit1: 0.987, digit5: 0.966, digit8: 0.945, microAvg: 0.978, macroAvg: 0.973 },
    { fpr: 0.08, tpr: 0.08, random: 0.08, digit0: 0.997, digit1: 0.994, digit5: 0.980, digit8: 0.968, microAvg: 0.987, macroAvg: 0.985 },
    { fpr: 0.1, tpr: 0.1, random: 0.1, digit0: 0.998, digit1: 0.996, digit5: 0.986, digit8: 0.976, microAvg: 0.991, macroAvg: 0.989 },
    { fpr: 0.15, tpr: 0.15, random: 0.15, digit0: 0.9995, digit1: 0.998, digit5: 0.993, digit8: 0.986, microAvg: 0.996, macroAvg: 0.994 },
    { fpr: 0.2, tpr: 0.2, random: 0.2, digit0: 1.0, digit1: 0.999, digit5: 0.996, digit8: 0.991, microAvg: 0.998, macroAvg: 0.997 },
    { fpr: 0.3, tpr: 0.3, random: 0.3, digit0: 1.0, digit1: 1.0, digit5: 0.998, digit8: 0.996, microAvg: 0.999, macroAvg: 0.9985 },
    { fpr: 0.4, tpr: 0.4, random: 0.4, digit0: 1.0, digit1: 1.0, digit5: 0.999, digit8: 0.998, microAvg: 1.0, macroAvg: 0.999 },
    { fpr: 0.5, tpr: 0.5, random: 0.5, digit0: 1.0, digit1: 1.0, digit5: 1.0, digit8: 0.999, microAvg: 1.0, macroAvg: 1.0 },
    { fpr: 0.6, tpr: 0.6, random: 0.6, digit0: 1.0, digit1: 1.0, digit5: 1.0, digit8: 1.0, microAvg: 1.0, macroAvg: 1.0 },
    { fpr: 0.7, tpr: 0.7, random: 0.7, digit0: 1.0, digit1: 1.0, digit5: 1.0, digit8: 1.0, microAvg: 1.0, macroAvg: 1.0 },
    { fpr: 0.8, tpr: 0.8, random: 0.8, digit0: 1.0, digit1: 1.0, digit5: 1.0, digit8: 1.0, microAvg: 1.0, macroAvg: 1.0 },
    { fpr: 0.9, tpr: 0.9, random: 0.9, digit0: 1.0, digit1: 1.0, digit5: 1.0, digit8: 1.0, microAvg: 1.0, macroAvg: 1.0 },
    { fpr: 1.0, tpr: 1.0, random: 1.0, digit0: 1.0, digit1: 1.0, digit5: 1.0, digit8: 1.0, microAvg: 1.0, macroAvg: 1.0 },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl">ML Model Dashboard</h1>
            <p className="text-slate-600">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Model Configuration */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Model:</span>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVM">SVM</SelectItem>
                    <SelectItem value="Random Forest">Random Forest</SelectItem>
                    <SelectItem value="Neural Network">Neural Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline">C=1.0</Badge>
              <Badge variant="outline">Kernel: RBF</Badge>
              <Badge variant="outline">Gamma: 0.001</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Accuracy:</span>
                <span>{metrics.accuracy}%</span>
              </div>
              <Progress value={metrics.accuracy} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Precision</p>
                <p className="text-2xl">{metrics.precision}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Recall</p>
                <p className="text-2xl">{metrics.recall}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">F1-Score</p>
                <p className="text-2xl">{metrics.f1Score}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Advanced Features */}
        <Tabs defaultValue="confusion" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
            <TabsTrigger value="roc">ROC Curve</TabsTrigger>
            <TabsTrigger value="hyperparams">Hyperparameters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="confusion">
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix</CardTitle>
                <CardDescription>10x10 matrix for digits 0-9</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="grid grid-cols-11 gap-1 text-xs">
                      <div></div>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={`header-${i}`} className="text-center p-1">{i}</div>
                      ))}
                      {confusionMatrix.map((row, i) => (
                        <React.Fragment key={`row-${i}`}>
                          <div className="p-1">{i}</div>
                          {row.map((val, j) => (
                            <div
                              key={`cell-${i}-${j}`}
                              className={`p-1 text-center rounded ${
                                i === j
                                  ? 'bg-green-100 text-green-900'
                                  : val > 5
                                  ? 'bg-red-100 text-red-900'
                                  : val > 0
                                  ? 'bg-yellow-50 text-yellow-900'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              {val}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roc">
            <Card>
              <CardHeader>
                <CardTitle>ROC Curve Analysis</CardTitle>
                <CardDescription>Receiver Operating Characteristic for Multi-Class Digit Recognition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={rocData}
                      margin={{ top: 20, right: 120, bottom: 60, left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="fpr" 
                        type="number" 
                        domain={[0, 1]}
                        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                        label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#475569' } }}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        dataKey="tpr" 
                        type="number" 
                        domain={[0, 1]}
                        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                        label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#475569' } }}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                                <p className="text-sm font-semibold text-slate-900">{payload[0].name}</p>
                                <p className="text-xs text-slate-600">FPR: {data.fpr.toFixed(3)}</p>
                                <p className="text-xs text-slate-600">TPR: {data.tpr.toFixed(3)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right"
                        wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
                        iconType="line"
                      />
                      
                      {/* Random Classifier Reference Line */}
                      <Line 
                        dataKey="random" 
                        stroke="#94a3b8" 
                        strokeWidth={2} 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Random Classifier (AUC = 0.50)"
                        legendType="line"
                      />
                      
                      {/* Individual digit class curves */}
                      <Line 
                        dataKey="digit0" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        dot={false}
                        name="Digit 0 (AUC = 0.998)"
                      />
                      <Line 
                        dataKey="digit1" 
                        stroke="#f97316" 
                        strokeWidth={2} 
                        dot={false}
                        name="Digit 1 (AUC = 0.997)"
                      />
                      <Line 
                        dataKey="digit5" 
                        stroke="#06b6d4" 
                        strokeWidth={2} 
                        dot={false}
                        name="Digit 5 (AUC = 0.993)"
                      />
                      <Line 
                        dataKey="digit8" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        dot={false}
                        name="Digit 8 (AUC = 0.994)"
                      />
                      
                      {/* Micro and Macro average curves */}
                      <Line 
                        dataKey="microAvg" 
                        stroke="#ec4899" 
                        strokeWidth={3} 
                        dot={false}
                        name="Micro-average (AUC = 0.995)"
                        strokeDasharray="3 3"
                      />
                      <Line 
                        dataKey="macroAvg" 
                        stroke="#0891b2" 
                        strokeWidth={3} 
                        dot={false}
                        name="Macro-average (AUC = 0.995)"
                        strokeDasharray="3 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Performance Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">Overall Performance</p>
                    <p className="text-lg text-slate-900 mt-1">Excellent</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">Avg AUC Score</p>
                    <p className="text-lg text-slate-900 mt-1">0.995</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">Best Class</p>
                    <p className="text-lg text-slate-900 mt-1">Digit 0</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">Min AUC</p>
                    <p className="text-lg text-slate-900 mt-1">0.992</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hyperparams">
            <Card>
              <CardHeader>
                <CardTitle>Hyperparameter Tuning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm">C Parameter</label>
                    <Select defaultValue="1.0">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">0.1</SelectItem>
                        <SelectItem value="1.0">1.0</SelectItem>
                        <SelectItem value="10.0">10.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Gamma</label>
                    <Select defaultValue="0.001">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.001">0.001</SelectItem>
                        <SelectItem value="0.01">0.01</SelectItem>
                        <SelectItem value="0.1">0.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setOptimizationDialogOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Run Hyperparameter Optimization
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions & Dataset Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Model (.pkl)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setCompareModelsDialogOpen(true)}>
                <Activity className="w-4 h-4 mr-2" />
                Compare Models
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dataset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Dataset:</strong> MNIST</p>
              <p><strong>Size:</strong> 70,000 images</p>
              <p><strong>Format:</strong> 28x28 grayscale</p>
              <p><strong>Split:</strong> 60k train / 10k test</p>
              <Button variant="outline" className="w-full mt-4">
                <Download className="w-4 h-4 mr-2" />
                Download Sample Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compare Models Dialog */}
        <Dialog open={compareModelsDialogOpen} onOpenChange={setCompareModelsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Compare Models</DialogTitle>
              <DialogDescription>
                Select the models you want to compare.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model1">Model 1</Label>
                <Select id="model1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVM">SVM</SelectItem>
                    <SelectItem value="Random Forest">Random Forest</SelectItem>
                    <SelectItem value="Neural Network">Neural Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model2">Model 2</Label>
                <Select id="model2">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVM">SVM</SelectItem>
                    <SelectItem value="Random Forest">Random Forest</SelectItem>
                    <SelectItem value="Neural Network">Neural Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setCompareModelsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Compare</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hyperparameter Optimization Dialog */}
        <Dialog open={optimizationDialogOpen} onOpenChange={setOptimizationDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Hyperparameter Optimization</DialogTitle>
              <DialogDescription>
                Running hyperparameter optimization may take some time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cParam">C Parameter</Label>
                <Input id="cParam" type="number" step="0.1" defaultValue="1.0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gamma">Gamma</Label>
                <Input id="gamma" type="number" step="0.001" defaultValue="0.001" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setOptimizationDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={() => setOptimizing(true)}>
                {optimizing ? (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Optimizing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Optimize
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}