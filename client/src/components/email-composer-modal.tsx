import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Mail, Copy, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  jobTitle: string;
  companyName: string;
  generatedEmail: string;
  isGeneratingEmail: boolean;
  onRegenerateEmail: () => void;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  recipientEmail,
  jobTitle,
  companyName,
  generatedEmail,
  isGeneratingEmail,
  onRegenerateEmail
}: EmailComposerModalProps) {
  const [emailContent, setEmailContent] = useState(generatedEmail);
  const [subject, setSubject] = useState(`Application for ${jobTitle} position at ${companyName}`);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Update email content when generated email changes
  useEffect(() => {
    if (generatedEmail) {
      setEmailContent(generatedEmail);
    }
  }, [generatedEmail]);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/send-email', {
        method: 'POST',
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject,
          body: emailContent.replace(/\n/g, '<br/>')
        })
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Email sent successfully!",
          description: `Your application has been sent to ${recipientEmail}`,
        });
        onClose();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again or use the copy option",
        variant: "destructive"
      });
    }
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Email copied!",
      description: "You can now paste it into your email client",
    });
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailContent)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            Compose Application Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={recipientEmail}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-content">Email Content</Label>
              {isGeneratingEmail ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating personalized email...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This may take 10-15 seconds
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerateEmail}
                >
                  Regenerate Email
                </Button>
              )}
            </div>
            <Textarea
              id="email-content"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Your email content..."
              className="min-h-[400px] font-mono text-sm"
              disabled={isGeneratingEmail}
            />
          </div>

          {!generatedEmail && !isGeneratingEmail && (
            <Alert>
              <AlertDescription>
                Click "Regenerate Email" to generate a personalized email based on your resume and the job details.
                {!emailContent && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Note: Make sure you are signed in with Google to generate emails.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2 flex-col sm:flex-row">
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={handleCopyEmail}
              disabled={!emailContent || isGeneratingEmail}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Email
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenMailClient}
              disabled={!emailContent || isGeneratingEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Open in Mail App
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={!emailContent || !subject || isGeneratingEmail || sendEmailMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send via Gmail
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}