import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Upload, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { predictApi } from '../services/api';
import { toast } from 'sonner';

export default function EndUserUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ digit: number; confidence: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<{ status: string; message: string; ready: boolean } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        setSelectedFile(file);
        setResult(null);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Process image with API
        processImage(file);
      } else {
        alert('File size must be less than 5MB');
      }
    } else {
      alert('Please upload a PNG or JPG image');
    }
  };

  // Check training status immediately on component mount and periodically
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const status = await predictApi.getTrainingStatus();
        setTrainingStatus(status);
        setCheckingStatus(false);
        
        // If training is in progress, poll every 2 seconds
        if (status.status === 'in_progress') {
          interval = setInterval(async () => {
            try {
              const updatedStatus = await predictApi.getTrainingStatus();
              setTrainingStatus(updatedStatus);
              if (updatedStatus.status !== 'in_progress') {
                if (interval) {
                  clearInterval(interval);
                  interval = null;
                }
              }
            } catch (err) {
              console.error('Error checking training status:', err);
              setCheckingStatus(false);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking training status:', error);
        setCheckingStatus(false);
        // Set a default status if check fails
        setTrainingStatus({
          status: 'unknown',
          message: 'Unable to check training status. Please try again.',
          ready: false
        });
      }
    };
    
    // Check status immediately on mount
    checkStatus();
    
    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const processImage = async (file: File, retry: boolean = false) => {
    if (!file) return;

    // Check training status before processing (skip check on retry)
    if (!retry) {
      try {
        const status = await predictApi.getTrainingStatus();
        setTrainingStatus(status);
        
        if (!status.ready) {
          toast.info(status.message || 'Model is not ready. Please wait...');
          setCheckingStatus(true);
          
          // Poll for status until ready
          const pollInterval = setInterval(async () => {
            try {
              const updatedStatus = await predictApi.getTrainingStatus();
              setTrainingStatus(updatedStatus);
              
              if (updatedStatus.ready) {
                clearInterval(pollInterval);
                setCheckingStatus(false);
                // Retry the prediction once ready
                processImage(file, true);
              } else if (updatedStatus.status === 'failed') {
                clearInterval(pollInterval);
                setCheckingStatus(false);
                toast.error('Model training failed. Please contact administrator.');
              }
            } catch (err) {
              console.error('Error polling training status:', err);
            }
          }, 2000);
          
          // Stop polling after 5 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            setCheckingStatus(false);
          }, 300000);
          
          return;
        }
      } catch (error) {
        console.error('Error checking training status:', error);
      }
    }

    setProcessing(true);
    setProgress(0);
    setCheckingStatus(false);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Call prediction API
      const response = await predictApi.predict(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.success && response.data) {
        setResult({
          digit: response.data.digit,
          confidence: response.data.confidence, // Already a percentage from backend
        });
        toast.success('Prediction completed successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Handle 503 Service Unavailable (training in progress)
      const errorMessage = error.message || '';
      if (errorMessage.includes('503') || errorMessage.includes('training') || errorMessage.includes('not ready')) {
        toast.warning('Model is still training. Please wait and try again.');
        // Update status and start polling
        try {
          const status = await predictApi.getTrainingStatus();
          setTrainingStatus(status);
        } catch (err) {
          console.error('Error checking training status:', err);
        }
      } else {
        toast.error(errorMessage || 'Failed to process image. Please try again.');
      }
      setResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle clipboard paste
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Find image in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if item is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        
        const blob = item.getAsFile();
        if (!blob) continue;

        // Convert blob to File
        const file = new File([blob], `pasted-image-${Date.now()}.png`, {
          type: item.type,
          lastModified: Date.now(),
        });

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Pasted image is too large. Maximum size is 5MB.');
          return;
        }

        // Process the pasted image
        handleFileSelect(file);
        toast.success('Image pasted from clipboard');
        return;
      }
    }
  };

  // Add paste event listener
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);
    
    // Add event listener to window
    window.addEventListener('paste', handlePasteEvent);
    
    // Cleanup
    return () => {
      window.removeEventListener('paste', handlePasteEvent);
    };
  }, []); // Empty dependency array - only set up once

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Digit Recognition Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Training Status Alert */}
            {trainingStatus && !trainingStatus.ready && (
              <Alert className={trainingStatus.status === 'in_progress' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}>
                <AlertDescription>
                  <div className="flex items-center gap-2">
                    {trainingStatus.status === 'in_progress' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <p className="font-medium">{trainingStatus.message}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
              } ${trainingStatus && !trainingStatus.ready ? 'opacity-50 pointer-events-none' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="mb-4">Drag & drop image here, paste from clipboard, or</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
                disabled={trainingStatus ? !trainingStatus.ready : false}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={trainingStatus ? !trainingStatus.ready : false}
              >
                Browse Files
              </Button>
              <p className="text-sm text-slate-500 mt-4">
                Supported: .png, .jpg, .jpeg – Max 5MB
              </p>
              <p className="text-xs text-slate-400 mt-2">
                💡 Tip: Press Ctrl+V (Cmd+V on Mac) to paste an image from clipboard
              </p>
            </div>

            {/* Preview */}
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="Preview" className="max-w-xs max-h-64 border rounded-lg shadow-md" />
              </div>
            )}

            {/* Checking Training Status */}
            {checkingStatus && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p>Waiting for model to finish training...</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Processing Progress */}
            {processing && (
              <div className="space-y-2">
                <p className="text-center">Processing...</p>
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm text-slate-600">{progress}%</p>
              </div>
            )}

            {/* Result */}
            {result && !processing && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <div className="space-y-4">
                    <p>Prediction Result:</p>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 border-2 border-green-600 rounded-lg flex items-center justify-center bg-white">
                        <span className="text-5xl">{result.digit}</span>
                      </div>
                      <div>
                        <p className="text-lg">→ Confidence: <span className="text-green-700">{result.confidence.toFixed(1)}%</span></p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {result && (
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const resultText = `Prediction Result:\nDigit: ${result.digit}\nConfidence: ${result.confidence.toFixed(1)}%\n\nGenerated at: ${new Date().toLocaleString()}`;
                    const blob = new Blob([resultText], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `prediction_result_${Date.now()}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success('Result downloaded');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </Button>
                <Button onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Another Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
