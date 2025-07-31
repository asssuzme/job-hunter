import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ResumeUploadProps {
  onResumeTextChange: (text: string | null) => void;
}

export function ResumeUpload({ onResumeTextChange }: ResumeUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .pdf, or .docx file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    try {
      if (file.type === 'text/plain') {
        // Handle text files
        const text = await file.text();
        onResumeTextChange(text);
      } else {
        // For PDF and DOCX files, we'll just read them as text for now
        // In a production app, you'd use proper libraries to extract text
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          // For demo purposes, we'll use the raw content
          // In production, use pdf.js for PDFs or mammoth.js for DOCX
          onResumeTextChange(content);
        };
        reader.readAsText(file);
      }

      toast({
        title: "Resume uploaded",
        description: "Your resume has been successfully uploaded",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Upload failed",
        description: "Failed to process your resume. Please try again.",
        variant: "destructive",
      });
      setFileName(null);
      onResumeTextChange(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setFileName(null);
    onResumeTextChange(null);
    // Reset the file input
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Upload (Optional)
        </CardTitle>
        <CardDescription>
          Upload your resume to generate more personalized application emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!fileName ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <span className="text-sm text-gray-600">
                Click to upload or drag and drop
              </span>
              <input
                id="resume-upload"
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="sr-only"
                disabled={isProcessing}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              TXT, PDF, or DOCX (max. 10MB)
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => document.getElementById('resume-upload')?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select File
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500">Resume uploaded successfully</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}