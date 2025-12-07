import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Upload, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface EndUserUploadProps {
  onBack: () => void;
}

export default function EndUserUpload({ onBack }: EndUserUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ digit: number; confidence: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

        // Simulate processing
        processImage();
      } else {
        alert('File size must be less than 5MB');
      }
    } else {
      alert('Please upload a PNG or JPG image');
    }
  };

  const processImage = () => {
    setProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          // Mock prediction
          const mockDigit = Math.floor(Math.random() * 10);
          const mockConfidence = 90 + Math.random() * 9;
          setResult({ digit: mockDigit, confidence: mockConfidence });
          return 100;
        }
        return prev + 5;
      });
    }, 50);
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
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
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="mb-4">Drag & drop image here or</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <p className="text-sm text-slate-500 mt-4">
                Supported: .png, .jpg, .jpeg – Max 5MB
              </p>
            </div>

            {/* Preview */}
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="Preview" className="max-w-xs max-h-64 border rounded-lg shadow-md" />
              </div>
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
                <Button variant="outline">
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
