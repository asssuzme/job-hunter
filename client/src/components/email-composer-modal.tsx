import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Mail, Copy, CheckCircle, Sparkles, ShieldCheck, Unlink } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Spinner, DotsLoader } from "@/components/ui/loading-animations";

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  jobTitle: string;
  companyName: string;
  jobUrl?: string;
  companyWebsite?: string;
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
  jobUrl,
  companyWebsite,
  generatedEmail,
  isGeneratingEmail,
  onRegenerateEmail
}: EmailComposerModalProps) {
  const [emailContent, setEmailContent] = useState(generatedEmail);
  const [subject, setSubject] = useState(`Application for ${jobTitle} position at ${companyName}`);
  const [copied, setCopied] = useState(false);
  const [localGenerating, setLocalGenerating] = useState(false);
  // Removed showGmailAuth state - users already have Gmail access through main Google OAuth
  const { toast } = useToast();
  
  // Check Gmail authorization status
  const { data: gmailStatus } = useQuery({
    queryKey: ['/api/auth/gmail/status'],
    enabled: isOpen
  }) as { data?: { isLinked?: boolean; hasGmailAccess?: boolean; isActive?: boolean } };
  
  // Handle Gmail authorization
  // Removed Gmail authorization mutation - users already have Gmail access through main Google OAuth
  
  // Handle Gmail unlink
  const unlinkGmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/gmail/unlink', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/gmail/status'] });
      toast({
        title: "Gmail unlinked",
        description: "Your Gmail account has been unlinked. You can relink it anytime.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unlink Gmail",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // Update email content when generated email changes
  useEffect(() => {
    if (generatedEmail) {
      setEmailContent(generatedEmail);
      setLocalGenerating(false);
    }
  }, [generatedEmail]);
  
  // Sync local generating state with parent state
  useEffect(() => {
    if (!isGeneratingEmail) {
      setLocalGenerating(false);
    }
  }, [isGeneratingEmail]);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/send-email', {
        method: 'POST',
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject,
          body: emailContent.replace(/\n/g, '<br/>'),
          jobTitle: jobTitle,
          companyName: companyName,
          jobUrl: jobUrl,
          companyWebsite: companyWebsite
        })
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        if (data.sentViaGmail) {
          // Email was sent directly via Gmail
          toast({
            title: "Email sent successfully!",
            description: `Your application has been sent to ${recipientEmail}`,
          });
          onClose();
        } else {
          // Fall back to opening in email client
          if (data.gmailComposeUrl) {
            window.open(data.gmailComposeUrl, '_blank');
          } else if (data.mailtoLink) {
            window.location.href = data.mailtoLink;
          }
          
          toast({
            title: "Email draft created!",
            description: "Opening in your email client. Please send the email from there.",
          });
          onClose();
        }
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
      <DialogContent className="w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-2xl flex items-center gap-2">
            <Mail className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            Compose Application Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4 py-3 md:py-4">
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
              {(isGeneratingEmail || localGenerating) ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DotsLoader />
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
                  onClick={() => {
                    setLocalGenerating(true);
                    toast({
                      title: "Generating email...",
                      description: "Creating a personalized email based on your resume",
                    });
                    onRegenerateEmail();
                  }}
                  className="opacity-100 hover:opacity-80 transition-opacity"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
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
            {gmailStatus?.isLinked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => unlinkGmailMutation.mutate()}
                disabled={unlinkGmailMutation.isPending}
                className="text-muted-foreground hover:text-foreground"
              >
                {unlinkGmailMutation.isPending ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Unlink className="h-4 w-4 mr-2" />
                )}
                Unlink Gmail
              </Button>
            )}
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
                  <Spinner className="mr-2" />
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
        
        {/* Gmail Authorization Prompt */}
        {/* Removed Gmail authorization UI - users already have Gmail access through main Google OAuth */}
      </DialogContent>
    </Dialog>
  );
}