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
import { LogOut, Download, Settings, BarChart3, Activity, TrendingUp, Play } from 'lucide-react';
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
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrixData["matrix"]>([]);
  const [rocData, setRocData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareModelsDialogOpen, setCompareModelsDialogOpen] = useState(false);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [tuneId, setTuneId] = useState<string | null>(null);
  const [cParam, setCParam] = useState('1.0');
  const [gamma, setGamma] = useState('0.001');
  const [compareModel1Id, setCompareModel1Id] = useState<number | null>(null);
  const [compareModel2Id, setCompareModel2Id] = useState<number | null>(null);
  const [compareModel1Data, setCompareModel1Data] = useState<any>(null);
  const [compareModel2Data, setCompareModel2Data] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  const [trainModelDialogOpen, setTrainModelDialogOpen] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [trainModelType, setTrainModelType] = useState('svm');
  const [trainCParam, setTrainCParam] = useState('1.0');
  const [trainGamma, setTrainGamma] = useState('scale');
  const [trainKernel, setTrainKernel] = useState('rbf');
  const [rocCurveData, setRocCurveData] = useState<ROCCurveData | null>(null);

  // Fetch models list on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await modelsApi.listModels();
        if (response.success) {
          if (response.data.length > 0) {
            setModels(response.data);
            setSelectedModelId(response.data[0].id);
          } else {
            toast.info('No models available. You can train a new model.');
          }
        } else {
          toast.error('Failed to load models: Invalid response from server');
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        toast.error(`Failed to load models: ${errorMessage}`);
        console.error('Error fetching models:', error);
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
          // Store raw ROC curve data for dynamic rendering
          const rawRocData = rocRes.data;
          setRocCurveData(rawRocData);
          
          // Transform ROC data for chart
          const chartData: any[] = [];
          const maxLength = Math.max(
            rawRocData.micro_avg.fpr.length,
            rawRocData.macro_avg.fpr.length,
            ...rawRocData.curves.map(c => c.fpr.length)
          );

          for (let i = 0; i < maxLength; i++) {
            const point: any = {
              fpr: rawRocData.micro_avg.fpr[i] || 0,
              tpr: rawRocData.micro_avg.tpr[i] || 0,
              random: rawRocData.micro_avg.fpr[i] || 0,
              microAvg: rawRocData.micro_avg.tpr[i] || 0,
              macroAvg: rawRocData.macro_avg.tpr[i] || 0,
            };

            // Add individual digit curves dynamically for all 10 digits
            rawRocData.curves.forEach((curve) => {
              point[`digit${curve.class}`] = curve.tpr[i] || 0;
            });

            chartData.push(point);
          }
          setRocData(chartData);
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        toast.error(`Failed to load model data: ${errorMessage}`);
        console.error('Error fetching model data:', error);
        // Set empty states on error
        setModelDetails(null);
        setMetrics(null);
        setConfusionMatrix([]);
        setRocData([]);
        setRocCurveData(null);
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
            setTuneId(null);
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
          } else if (response.data.status === 'failed') {
            setOptimizing(false);
            setTuneId(null);
            toast.error('Hyperparameter optimization failed');
          }
        }
      } catch (error: any) {
        console.error('Failed to check tuning status:', error);
        // Don't show toast for polling errors to avoid spam
        // Only show if it's a critical error
        if (error?.message && !error.message.includes('status')) {
          toast.error('Failed to check optimization status');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [optimizing, tuneId, selectedModelId]);

  // Poll for training status if training
  useEffect(() => {
    if (!training || !trainingId) return;

    const interval = setInterval(async () => {
      try {
        // Note: Backend doesn't have training status endpoint yet, so we'll simulate
        // In a real implementation, you'd call: modelsApi.getTrainingStatus(trainingId)
        // For now, we'll just check if models list has changed (new model added)
        const response = await modelsApi.listModels();
        if (response.success) {
          const newModels = response.data;
          if (newModels.length > models.length) {
            setTraining(false);
            setTrainingId(null);
            setModels(newModels);
            toast.success('Model training completed!');
            setTrainModelDialogOpen(false);
          }
        }
      } catch (error: any) {
        console.error('Failed to check training status:', error);
        // Don't show toast for polling errors to avoid spam
        if (error?.message && !error.message.includes('status')) {
          toast.error('Failed to check training status');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [training, trainingId, models.length]);

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
      const errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('501') || errorMessage.includes('Not Implemented')) {
        toast.error('Model export is not yet implemented on the backend');
      } else {
        toast.error(`Failed to export model: ${errorMessage}`);
      }
      console.error('Error exporting model:', error);
    }
  };

  const handleStartOptimization = async () => {
    if (!selectedModelId) {
      toast.error('No model selected');
      return;
    }
    try {
      setOptimizing(true);
      setOptimizationDialogOpen(false);
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
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to start optimization: ${errorMessage}`);
      console.error('Error starting optimization:', error);
      setOptimizing(false);
      setTuneId(null);
    }
  };

  const handleCompareModels = async () => {
    if (!compareModel1Id || !compareModel2Id) {
      toast.error('Please select both models to compare');
      return;
    }
    if (compareModel1Id === compareModel2Id) {
      toast.error('Please select two different models');
      return;
    }
    try {
      setComparing(true);
      const [model1Details, model1Metrics, model2Details, model2Metrics] = await Promise.all([
        modelsApi.getModelDetails(compareModel1Id),
        modelsApi.getModelMetrics(compareModel1Id),
        modelsApi.getModelDetails(compareModel2Id),
        modelsApi.getModelMetrics(compareModel2Id),
      ]);
      
      let hasError = false;
      if (model1Details.success && model1Metrics.success) {
        setCompareModel1Data({
          ...model1Details.data,
          metrics: model1Metrics.data,
        });
      } else {
        hasError = true;
        toast.error('Failed to load data for Model 1');
      }
      
      if (model2Details.success && model2Metrics.success) {
        setCompareModel2Data({
          ...model2Details.data,
          metrics: model2Metrics.data,
        });
      } else {
        hasError = true;
        toast.error('Failed to load data for Model 2');
      }
      
      if (!hasError) {
        toast.success('Models compared successfully');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to compare models: ${errorMessage}`);
      console.error('Error comparing models:', error);
      setCompareModel1Data(null);
      setCompareModel2Data(null);
    } finally {
      setComparing(false);
    }
  };

  const handleDownloadSampleData = async () => {
    try {
      // Create a link to MNIST dataset or provide sample data
      // For now, we'll provide a link to the official MNIST dataset
      const link = document.createElement('a');
      link.href = 'http://yann.lecun.com/exdb/mnist/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Opening MNIST dataset page in new tab');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to open dataset page: ${errorMessage}`);
      console.error('Error downloading sample data:', error);
    }
  };

  const handleTrainModel = async () => {
    // Validate inputs
    if (!trainModelType) {
      toast.error('Please select a model type');
      return;
    }
    if (!trainCParam || isNaN(parseFloat(trainCParam)) || parseFloat(trainCParam) <= 0) {
      toast.error('Please enter a valid C parameter (must be > 0)');
      return;
    }
    if (!trainKernel) {
      toast.error('Please select a kernel type');
      return;
    }
    
    try {
      setTraining(true);
      setTrainModelDialogOpen(false);
      const response = await modelsApi.trainModel({
        model_type: trainModelType,
        hyperparameters: {
          C: parseFloat(trainCParam),
          gamma: trainGamma,
          kernel: trainKernel,
        },
      });
      if (response.success) {
        setTrainingId(response.data.training_id);
        toast.success('Model training started. This may take 5-8 minutes.');
      } else {
        toast.error('Failed to start training: Invalid response from server');
        setTraining(false);
        setTrainingId(null);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to start training: ${errorMessage}`);
      console.error('Error starting training:', error);
      setTraining(false);
      setTrainingId(null);
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
                      
                      {/* Individual digit class curves - dynamically render all 10 digits */}
                      {rocCurveData?.curves.map((curve) => {
                        const colors = [
                          '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#06b6d4',
                          '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
                        ];
                        return (
                          <Line 
                            key={`digit${curve.class}`}
                            dataKey={`digit${curve.class}`}
                            stroke={colors[curve.class % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            name={`Digit ${curve.class} (AUC = ${curve.auc.toFixed(3)})`}
                          />
                        );
                      })}
                      
                      {/* Micro and Macro average curves */}
                      {rocCurveData && (
                        <>
                          <Line 
                            dataKey="microAvg" 
                            stroke="#ec4899" 
                            strokeWidth={3} 
                            dot={false}
                            name={`Micro-average (AUC = ${rocCurveData.micro_avg.auc.toFixed(3)})`}
                            strokeDasharray="3 3"
                          />
                          <Line 
                            dataKey="macroAvg" 
                            stroke="#0891b2" 
                            strokeWidth={3} 
                            dot={false}
                            name={`Macro-average (AUC = ${rocCurveData.macro_avg.auc.toFixed(3)})`}
                            strokeDasharray="3 3"
                          />
                        </>
                      )}
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
                <div className="flex items-center gap-2">
                  <CardTitle>Hyperparameter Tuning</CardTitle>
                  <Badge variant="secondary">Not Available</Badge>
                </div>
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
                  disabled
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
                disabled
                onClick={() => {
                  if (models.length < 2) {
                    toast.info('At least 2 models are required for comparison. Currently only 1 SVM model is supported.');
                  } else {
                    setCompareModelsDialogOpen(true);
                  }
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                Compare Models
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setTrainModelDialogOpen(true)}
                disabled
              >
                <Play className="w-4 h-4 mr-2" />
                Train New Model
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
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleDownloadSampleData}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compare Models Dialog */}
        <Dialog open={compareModelsDialogOpen} onOpenChange={setCompareModelsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compare Models</DialogTitle>
              <DialogDescription>
                {models.length < 2 
                  ? 'At least 2 models are required for comparison. Currently only 1 SVM model is supported.'
                  : 'Select two models to compare their performance metrics.'}
              </DialogDescription>
            </DialogHeader>
            {models.length < 2 ? (
              <div className="py-4 text-center text-slate-500">
                <p>Only {models.length} model available. Multiple models are required for comparison.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model1">Model 1</Label>
                    <Select 
                      value={compareModel1Id?.toString() || ''} 
                      onValueChange={(value) => setCompareModel1Id(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select first model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.model_type.toUpperCase()} (ID: {model.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model2">Model 2</Label>
                    <Select 
                      value={compareModel2Id?.toString() || ''} 
                      onValueChange={(value) => setCompareModel2Id(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select second model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.filter(m => m.id !== compareModel1Id).map((model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.model_type.toUpperCase()} (ID: {model.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {compareModel1Data && compareModel2Data && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      <h3 className="font-semibold text-lg">Comparison Results</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-slate-600">
                            Model 1: {compareModel1Data.model_type.toUpperCase()}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>Accuracy: {(compareModel1Data.metrics.accuracy * 100).toFixed(2)}%</p>
                            <p>Precision: {compareModel1Data.metrics.precision.toFixed(3)}</p>
                            <p>Recall: {compareModel1Data.metrics.recall.toFixed(3)}</p>
                            <p>F1-Score: {compareModel1Data.metrics.f1_score.toFixed(3)}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-slate-600">
                            Model 2: {compareModel2Data.model_type.toUpperCase()}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>Accuracy: {(compareModel2Data.metrics.accuracy * 100).toFixed(2)}%</p>
                            <p>Precision: {compareModel2Data.metrics.precision.toFixed(3)}</p>
                            <p>Recall: {compareModel2Data.metrics.recall.toFixed(3)}</p>
                            <p>F1-Score: {compareModel2Data.metrics.f1_score.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Winner by Metric:</p>
                        <div className="space-y-1 text-xs">
                          <p>Accuracy: {compareModel1Data.metrics.accuracy > compareModel2Data.metrics.accuracy ? 'Model 1' : 'Model 2'}</p>
                          <p>Precision: {compareModel1Data.metrics.precision > compareModel2Data.metrics.precision ? 'Model 1' : 'Model 2'}</p>
                          <p>Recall: {compareModel1Data.metrics.recall > compareModel2Data.metrics.recall ? 'Model 1' : 'Model 2'}</p>
                          <p>F1-Score: {compareModel1Data.metrics.f1_score > compareModel2Data.metrics.f1_score ? 'Model 1' : 'Model 2'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    onClick={() => {
                      setCompareModelsDialogOpen(false);
                      setCompareModel1Id(null);
                      setCompareModel2Id(null);
                      setCompareModel1Data(null);
                      setCompareModel2Data(null);
                    }}
                  >
                    Close
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleCompareModels}
                    disabled={!compareModel1Id || !compareModel2Id || comparing || compareModel1Id === compareModel2Id}
                  >
                    {comparing ? 'Comparing...' : 'Compare'}
                  </Button>
                </DialogFooter>
              </>
            )}
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
              {optimizing && tuneId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    Optimization in progress... This may take several minutes.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => {
                  setOptimizationDialogOpen(false);
                  if (!optimizing) {
                    setOptimizing(false);
                    setTuneId(null);
                  }
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

        {/* Train Model Dialog */}
        <Dialog open={trainModelDialogOpen} onOpenChange={setTrainModelDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Train New Model</DialogTitle>
              <DialogDescription>
                Train a new SVM model with custom hyperparameters. Currently only SVM models are supported.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trainModelType">Model Type</Label>
                <Select value={trainModelType} onValueChange={setTrainModelType} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svm">SVM (Support Vector Machine)</SelectItem>
                    <SelectItem value="random_forest" disabled>Random Forest (Not Available)</SelectItem>
                    <SelectItem value="neural_network" disabled>Neural Network (Not Available)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Only SVM models are currently supported</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trainKernel">Kernel</Label>
                <Select value={trainKernel} onValueChange={setTrainKernel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rbf">RBF (Radial Basis Function)</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="poly">Polynomial</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainCParam">C Parameter</Label>
                  <Input 
                    id="trainCParam" 
                    type="number" 
                    step="0.1" 
                    min="0.1"
                    value={trainCParam}
                    onChange={(e) => setTrainCParam(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trainGamma">Gamma</Label>
                  <Select value={trainGamma} onValueChange={setTrainGamma}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scale">Scale</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="0.001">0.001</SelectItem>
                      <SelectItem value="0.01">0.01</SelectItem>
                      <SelectItem value="0.1">0.1</SelectItem>
                      <SelectItem value="1.0">1.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {training && trainingId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    Training in progress... This may take 5-8 minutes.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Training ID: {trainingId}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => {
                  setTrainModelDialogOpen(false);
                  if (!training) {
                    setTraining(false);
                    setTrainingId(null);
                  }
                }}
                disabled={training}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleTrainModel}
                disabled={training || !trainModelType}
              >
                {training ? (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Training...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    Start Training
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