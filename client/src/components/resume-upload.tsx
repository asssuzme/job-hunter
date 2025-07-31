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

    // Check file size (5MB limit to be safe)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type - only accepting text files for now
    const validTypes = ['text/plain'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file. PDF and DOCX support coming soon!",
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
        // Clean the text to remove null bytes and other invalid characters
        const cleanedText = text.replace(/\0/g, '').trim();
        onResumeTextChange(cleanedText);
      } else {
        // For now, only support plain text files
        toast({
          title: "File format not supported",
          description: "Currently only .txt files are supported. Please convert your resume to plain text.",
          variant: "destructive",
        });
        setFileName(null);
        setIsProcessing(false);
        return;
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
                accept=".txt"
                onChange={handleFileUpload}
                className="sr-only"
                disabled={isProcessing}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Plain text files only (.txt) - max 5MB
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