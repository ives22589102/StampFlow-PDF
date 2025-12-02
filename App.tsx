import React, { useState, useCallback } from 'react';
import { Upload, Download, Type, Wand2, FileText, Settings, Move, Trash2 } from 'lucide-react';
import Button from './components/Button';
import StampEditor from './components/StampEditor';
import { getPdfPageAsImage, createStampedPdf } from './services/pdfService';
import { extractCodeFromText } from './services/geminiService';
import { StampConfig } from './types';

const INITIAL_STAMP: StampConfig = {
  text: '',
  x: 85, // Default top right area
  y: 5,
  fontSize: 16,
  color: '#FF0000'
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [stamp, setStamp] = useState<StampConfig>(INITIAL_STAMP);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // File Upload Handler
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setIsProcessing(true);
      try {
        const { imageUrl, textContent } = await getPdfPageAsImage(selectedFile);
        setFile(selectedFile);
        setPdfPreview(imageUrl);
        setExtractedText(textContent);
        // Reset stamp but keep default pos
        setStamp(prev => ({ ...INITIAL_STAMP, x: 85, y: 5 }));
      } catch (err) {
        alert('Error loading PDF. Please try a standard PDF file.');
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // AI Extraction Handler
  const handleAiExtract = async () => {
    if (!extractedText) return;
    setIsAnalyzing(true);
    try {
      const suggestedText = await extractCodeFromText(extractedText);
      if (suggestedText) {
        setStamp(prev => ({ ...prev, text: suggestedText }));
      } else {
        alert("Couldn't automatically find a code pattern (like PB 12345). Please enter it manually.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download Handler
  const handleDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await createStampedPdf(
        file, 
        stamp.text, 
        stamp.x, 
        stamp.y, 
        stamp.fontSize, 
        stamp.color
      );
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stamped_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to generate PDF');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfPreview(null);
    setExtractedText('');
    setStamp(INITIAL_STAMP);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">StampFlow PDF</h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Secure, Client-Side Processing
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {!file ? (
          // Empty State / Upload
          <div className="flex flex-col items-center justify-center min-h-[60vh] border-2 border-dashed border-gray-300 rounded-xl bg-white p-12 text-center">
            <div className="bg-indigo-50 p-4 rounded-full mb-4">
              <Upload className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload your PDF</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Drag and drop your sales document here, or click to browse. We'll help you add reference codes in seconds.
            </p>
            <label className="relative">
              <Button disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Select PDF Document'}
              </Button>
              <input 
                type="file" 
                accept="application/pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>
        ) : (
          // Editor Interface
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-gray-500" />
                    Configuration
                  </h3>
                  <button onClick={handleReset} className="text-sm text-red-600 hover:text-red-700 flex items-center">
                    <Trash2 className="h-4 w-4 mr-1" /> Clear
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Text Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stamp Text
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Type className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                        placeholder="e.g. PB 966753"
                        value={stamp.text}
                        onChange={(e) => setStamp({ ...stamp, text: e.target.value })}
                      />
                    </div>
                    {/* Gemini AI Helper */}
                    <div className="mt-2">
                       <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={handleAiExtract}
                        isLoading={isAnalyzing}
                        icon={<Wand2 className="h-3 w-3" />}
                      >
                        Auto-Detect Code (AI)
                      </Button>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size: {stamp.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      step="1"
                      value={stamp.fontSize}
                      onChange={(e) => setStamp({ ...stamp, fontSize: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={stamp.color}
                        onChange={(e) => setStamp({ ...stamp, color: e.target.value })}
                        className="h-8 w-14 p-0 border-0 rounded overflow-hidden cursor-pointer"
                      />
                      <span className="text-sm text-gray-500 uppercase">{stamp.color}</span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Coordinates Display */}
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Position</p>
                    <div className="flex justify-between text-sm text-gray-700 font-mono">
                      <span>X: {stamp.x.toFixed(1)}%</span>
                      <span>Y: {stamp.y.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Download Action */}
                  <Button 
                    className="w-full justify-center py-3 text-base"
                    onClick={handleDownload}
                    disabled={!stamp.text || isProcessing}
                    isLoading={isProcessing}
                    icon={<Download className="h-5 w-5" />}
                  >
                    Download Stamped PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-2 h-[600px] lg:h-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full p-1 flex flex-col">
                 <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <Move className="h-4 w-4 mr-2 text-indigo-500" />
                      Visual Editor
                    </h3>
                    <span className="text-xs text-gray-400">Page 1 Preview</span>
                 </div>
                 <div className="flex-1 relative overflow-hidden bg-gray-100 rounded-b-lg">
                    {pdfPreview && (
                      <StampEditor 
                        pdfImage={pdfPreview}
                        stamp={stamp}
                        onPositionChange={(x, y) => setStamp(prev => ({ ...prev, x, y }))}
                      />
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
