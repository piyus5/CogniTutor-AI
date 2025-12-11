import React, { useState } from 'react';
import { X, Mail, MessageSquare, Send, CheckCircle, Loader2, AlertCircle, Copy, ExternalLink, MessageCircle, Phone } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  // The specific authorized email address
  const targetEmail = "0173cs221091@gmail.com";
  const targetPhone = "+91-9569448534";
  const whatsappLink = "https://wa.me/919569448534";

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(false);

    // Using FormSubmit.co for backend-free email sending.
    // This sends a POST request to their service, which forwards the email to the developer.
    const endpoint = `https://formsubmit.co/ajax/${targetEmail}`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: `CogniTutor Support: ${subject} (from ${userEmail || 'Guest'})`,
                email: userEmail || 'anonymous@cognitutor.ai', // Sets the Reply-To address
                message: message,
                topic: subject,
                user_account: userEmail || 'Guest User',
                _template: 'table', // Formats the email nicely
                _captcha: 'false' // Disables the captcha for smoother UX
            })
        });

        if (response.ok) {
            setIsSuccess(true);
            // Auto close after success
            setTimeout(() => {
                resetForm();
                onClose();
            }, 3000);
        } else {
             throw new Error("Service responded with error");
        }
    } catch (error) {
        console.error("Direct send failed", error);
        setSubmissionError(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleManualEmail = () => {
    const emailSubject = encodeURIComponent(`CogniTutor Support: ${subject}`);
    const emailBody = encodeURIComponent(
        `User Account: ${userEmail || 'Guest'}\n` +
        `Topic: ${subject}\n\n` +
        `Message:\n${message}`
    );
    window.location.href = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;
    onClose();
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(targetEmail);
    alert("Email address copied to clipboard!");
  };

  const resetForm = () => {
      setIsSuccess(false);
      setSubmissionError(false);
      setSubject('');
      setMessage('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={24} />
              Support & Feedback
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Authority: Piyush Shukla
                </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Message Received!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                Your message has been sent directly to Piyush Shukla. We will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Fallback Error Message */}
              {submissionError && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">Connection Issue</p>
                        <p className="mb-2">We couldn't automatically send the message due to a network glitch.</p>
                        <button 
                            type="button"
                            onClick={handleManualEmail}
                            className="text-indigo-700 dark:text-indigo-400 font-bold underline hover:text-indigo-800 flex items-center gap-1"
                        >
                            Click here to Send via Email App
                            <ExternalLink size={12} />
                        </button>
                    </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Subject
                </label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                  required
                >
                  <option value="" disabled>Select a topic...</option>
                  <option value="technical">Technical Issue</option>
                  <option value="account">Account & Billing</option>
                  <option value="feedback">Feedback for Piyush</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message to Authority
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border resize-none"
                  placeholder="Describe your issue or feedback in detail..."
                  required
                />
              </div>

              <div className="space-y-3 pt-2">
                {/* Direct Contact Info - Email */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-700">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                          <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-xs">
                          <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Official Email</p>
                          <p className="text-slate-800 dark:text-slate-200 font-mono font-medium select-all">{targetEmail}</p>
                      </div>
                   </div>
                   <button 
                      type="button" 
                      onClick={copyEmail}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copy Email Address"
                   >
                      <Copy size={16} />
                   </button>
                </div>

                {/* Direct Contact Info - WhatsApp */}
                <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg flex items-center justify-between border border-green-100 dark:border-green-900/30">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-xs">
                          <p className="text-green-800 dark:text-green-300 font-medium uppercase tracking-wider">Mobile / WhatsApp</p>
                          <p className="text-slate-800 dark:text-slate-200 font-mono font-medium">{targetPhone}</p>
                      </div>
                   </div>
                   <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-bold shadow-sm"
                      title="Open in WhatsApp"
                   >
                      <Phone size={12} className="fill-current" />
                      Chat
                   </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Sending...
                    </>
                  ) : (
                    <>
                        Send Message 
                        <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};