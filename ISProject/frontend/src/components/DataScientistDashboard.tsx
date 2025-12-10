import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { modelsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { ModelInfo, MetricsData, ConfusionMatrixData, ROCCurveData } from '../types/api';
import React from 'react';

interface DataScientistDashboardProps {
  user: User;
}

export default function DataScientistDashboard({ user }: DataScientistDashboardProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [modelDetails, setModelDetails] = useState<any>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<number[][]>([]);
  const [rocData, setRocData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareModelsDialogOpen, setCompareModelsDialogOpen] = useState(false);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [tuneId, setTuneId] = useState<string | null>(null);
  const [cParam, setCParam] = useState('1.0');
  const [gamma, setGamma] = useState('0.001');

  // Fetch models list on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await modelsApi.listModels();
        if (response.success && response.data.length > 0) {
          setModels(response.data);
          setSelectedModelId(response.data[0].id);
        }
      } catch (error: any) {
        toast.error(`Failed to load models: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  // Fetch model data when selected model changes
  useEffect(() => {
    if (!selectedModelId) return;

    const fetchModelData = async () => {
      try {
        setLoading(true);
        const [detailsRes, metricsRes, confusionRes, rocRes] = await Promise.all([
          modelsApi.getModelDetails(selectedModelId),
          modelsApi.getModelMetrics(selectedModelId),
          modelsApi.getConfusionMatrix(selectedModelId),
          modelsApi.getROCCurve(selectedModelId),
        ]);

        if (detailsRes.success) setModelDetails(detailsRes.data);
        if (metricsRes.success) setMetrics(metricsRes.data);
        if (confusionRes.success) setConfusionMatrix(confusionRes.data.matrix);
        if (rocRes.success) {
          // Transform ROC data for chart
          const rocCurveData = rocRes.data;
          const chartData: any[] = [];
          const maxLength = Math.max(
            rocCurveData.micro_avg.fpr.length,
            rocCurveData.macro_avg.fpr.length,
            ...rocCurveData.curves.map(c => c.fpr.length)
          );

          for (let i = 0; i < maxLength; i++) {
            const point: any = {
              fpr: rocCurveData.micro_avg.fpr[i] || 0,
              tpr: rocCurveData.micro_avg.tpr[i] || 0,
              random: rocCurveData.micro_avg.fpr[i] || 0,
              microAvg: rocCurveData.micro_avg.tpr[i] || 0,
              macroAvg: rocCurveData.macro_avg.tpr[i] || 0,
            };

            // Add individual digit curves
            rocCurveData.curves.forEach((curve, idx) => {
              point[`digit${curve.class}`] = curve.tpr[i] || 0;
            });

            chartData.push(point);
          }
          setRocData(chartData);
        }
      } catch (error: any) {
        toast.error(`Failed to load model data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchModelData();
  }, [selectedModelId]);

  // Poll for tuning status if optimizing
  useEffect(() => {
    if (!optimizing || !tuneId || !selectedModelId) return;

    const interval = setInterval(async () => {
      try {
        const response = await modelsApi.getTuningStatus(selectedModelId, tuneId);
        if (response.success) {
          if (response.data.status === 'completed') {
            setOptimizing(false);
            toast.success('Hyperparameter optimization completed!');
            // Refresh model data
            if (selectedModelId) {
              const [detailsRes, metricsRes] = await Promise.all([
                modelsApi.getModelDetails(selectedModelId),
                modelsApi.getModelMetrics(selectedModelId),
              ]);
              if (detailsRes.success) setModelDetails(detailsRes.data);
              if (metricsRes.success) setMetrics(metricsRes.data);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check tuning status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [optimizing, tuneId, selectedModelId]);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(parseInt(modelId));
  };

  const handleExportModel = async () => {
    if (!selectedModelId) {
      toast.error('No model selected');
      return;
    }
    try {
      await modelsApi.exportModel(selectedModelId);
      toast.success('Model exported successfully');
    } catch (error: any) {
      toast.error(`Failed to export model: ${error.message}`);
    }
  };

  const handleStartOptimization = async () => {
    if (!selectedModelId) {
      toast.error('No model selected');
      return;
    }
    try {
      setOptimizing(true);
      const response = await modelsApi.startHyperparameterTuning(selectedModelId, {
        hyperparameters: {
          C: parseFloat(cParam),
          gamma: parseFloat(gamma),
        },
        optimization_method: 'grid_search',
      });
      if (response.success) {
        setTuneId(response.data.tune_id);
        toast.success('Hyperparameter optimization started');
      }
    } catch (error: any) {
      toast.error(`Failed to start optimization: ${error.message}`);
      setOptimizing(false);
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);
  const displayMetrics = metrics || {
    accuracy: selectedModel?.accuracy || 0,
    precision: selectedModel?.precision || 0,
    recall: selectedModel?.recall || 0,
    f1_score: selectedModel?.f1_score || 0,
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl">ML Model Dashboard</h1>
            <p className="text-slate-600">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
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
                <Select 
                  value={selectedModelId?.toString() || ''} 
                  onValueChange={handleModelChange}
                  disabled={loading || models.length === 0}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.model_type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {modelDetails?.hyperparameters && (
                <>
                  {modelDetails.hyperparameters.C && (
                    <Badge variant="outline">C={modelDetails.hyperparameters.C}</Badge>
                  )}
                  {modelDetails.hyperparameters.kernel && (
                    <Badge variant="outline">Kernel: {modelDetails.hyperparameters.kernel}</Badge>
                  )}
                  {modelDetails.hyperparameters.gamma && (
                    <Badge variant="outline">Gamma: {modelDetails.hyperparameters.gamma}</Badge>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading metrics...</div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Accuracy:</span>
                    <span>{(displayMetrics.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={displayMetrics.accuracy * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Precision</p>
                    <p className="text-2xl">{displayMetrics.precision.toFixed(3)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Recall</p>
                    <p className="text-2xl">{displayMetrics.recall.toFixed(3)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">F1-Score</p>
                    <p className="text-2xl">{displayMetrics.f1_score.toFixed(3)}</p>
                  </div>
                </div>
              </>
            )}
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
                {loading ? (
                  <div className="text-center py-8">Loading confusion matrix...</div>
                ) : confusionMatrix.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No confusion matrix data available</div>
                ) : (
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
                )}
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
                {loading ? (
                  <div className="text-center py-8">Loading ROC curve...</div>
                ) : rocData.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No ROC curve data available</div>
                ) : (
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
                )}
                
                {/* Performance Summary */}
                {metrics && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600">Overall Performance</p>
                      <p className="text-lg text-slate-900 mt-1">
                        {metrics.accuracy > 0.95 ? 'Excellent' : metrics.accuracy > 0.90 ? 'Good' : 'Fair'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600">Accuracy</p>
                      <p className="text-lg text-slate-900 mt-1">{(metrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600">F1-Score</p>
                      <p className="text-lg text-slate-900 mt-1">{metrics.f1_score.toFixed(3)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600">Precision</p>
                      <p className="text-lg text-slate-900 mt-1">{metrics.precision.toFixed(3)}</p>
                    </div>
                  </div>
                )}
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
                    <Select value={cParam} onValueChange={setCParam}>
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
                    <Select value={gamma} onValueChange={setGamma}>
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
                <Button 
                  className="w-full" 
                  onClick={() => setOptimizationDialogOpen(true)}
                  disabled={!selectedModelId}
                >
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
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportModel}
                disabled={!selectedModelId || loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Model (.pkl)
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setCompareModelsDialogOpen(true)}
                disabled={models.length < 2}
              >
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
                <Input 
                  id="cParam" 
                  type="number" 
                  step="0.1" 
                  value={cParam}
                  onChange={(e) => setCParam(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gamma">Gamma</Label>
                <Input 
                  id="gamma" 
                  type="number" 
                  step="0.001" 
                  value={gamma}
                  onChange={(e) => setGamma(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => {
                  setOptimizationDialogOpen(false);
                  setOptimizing(false);
                }}
                disabled={optimizing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleStartOptimization}
                disabled={optimizing || !selectedModelId}
              >
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