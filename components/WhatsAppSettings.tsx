import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import {
    MessageCircle,
    Settings,
    Check,
    X,
    AlertCircle,
    Send,
    Phone,
    Key,
    Hash,
    ExternalLink,
    RefreshCw,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare,
    ArrowRight,
} from 'lucide-react';

export const WhatsAppSettings: React.FC = () => {
    const config = useQuery(api.whatsapp.config.getMyConfig);
    const messageHistory = useQuery(api.whatsapp.config.getMessageHistory, { limit: 20 });
    const saveConfigMutation = useMutation(api.whatsapp.config.saveConfig);
    const testConnectionAction = useAction(api.whatsapp.twilio.testConnection);

    const [formData, setFormData] = useState({
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioPhoneNumber: '',
        enabled: false,
    });
    const [showToken, setShowToken] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

    // Load config into form when it changes
    useEffect(() => {
        if (config) {
            setFormData({
                twilioAccountSid: config.twilioAccountSid || '',
                twilioAuthToken: config.twilioAuthToken || '',
                twilioPhoneNumber: config.twilioPhoneNumber || '',
                enabled: config.enabled || false,
            });
        }
    }, [config]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveResult(null);
        try {
            await saveConfigMutation({
                twilioAccountSid: formData.twilioAccountSid,
                twilioAuthToken: formData.twilioAuthToken,
                twilioPhoneNumber: formData.twilioPhoneNumber,
                enabled: formData.enabled,
            });
            setSaveResult({ success: true, message: 'Settings saved successfully!' });
        } catch (error) {
            setSaveResult({ success: false, message: error instanceof Error ? error.message : 'Failed to save settings' });
        }
        setIsSaving(false);
    };

    const handleTest = async () => {
        if (!testPhone) {
            setTestResult({ success: false, message: 'Please enter a phone number to test' });
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        try {
            // First save the config
            await saveConfigMutation({
                twilioAccountSid: formData.twilioAccountSid,
                twilioAuthToken: formData.twilioAuthToken,
                twilioPhoneNumber: formData.twilioPhoneNumber,
                enabled: true,
            });

            // Then test the connection
            const result = await testConnectionAction({
                orgId: config?.orgId || '',
                testPhone: testPhone,
            });

            if (result.success) {
                setTestResult({ success: true, message: 'Test message sent successfully! Check your WhatsApp.' });
            } else {
                setTestResult({ success: false, message: result.error || 'Failed to send test message' });
            }
        } catch (error) {
            setTestResult({ success: false, message: error instanceof Error ? error.message : 'Test failed' });
        }
        setIsTesting(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DELIVERED':
            case 'READ':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'SENT':
            case 'QUEUED':
                return <Clock className="w-4 h-4 text-amber-500" />;
            case 'FAILED':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED':
            case 'READ':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'SENT':
            case 'QUEUED':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'FAILED':
                return 'bg-red-50 text-red-700 border-red-100';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        WhatsApp Integration
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Configure Twilio WhatsApp Business API for automated messaging</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${formData.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                        {formData.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {formData.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Configuration Card */}
                <div className="bg-surface rounded-3xl border border-slate-100 shadow-card p-8">
                    <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-slate-400" />
                        Twilio Configuration
                    </h3>

                    <div className="space-y-5">
                        {/* Account SID */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-slate-400" />
                                Account SID
                            </label>
                            <input
                                type="text"
                                value={formData.twilioAccountSid}
                                onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>

                        {/* Auth Token */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Key className="w-4 h-4 text-slate-400" />
                                Auth Token
                            </label>
                            <div className="relative">
                                <input
                                    type={showToken ? 'text' : 'password'}
                                    value={formData.twilioAuthToken}
                                    onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
                                    placeholder="Your Twilio Auth Token"
                                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                WhatsApp Business Number
                            </label>
                            <input
                                type="text"
                                value={formData.twilioPhoneNumber}
                                onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
                                placeholder="+14155238886"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Use the Twilio sandbox number for testing: +14155238886
                            </p>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-900">Enable WhatsApp</p>
                                <p className="text-sm text-slate-500">Send automated messages to drivers and customers</p>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                className={`relative w-14 h-8 rounded-full transition-colors ${formData.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${formData.enabled ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Save Configuration
                                </>
                            )}
                        </button>

                        {/* Save Result */}
                        {saveResult && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${saveResult.success
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {saveResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{saveResult.message}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Test Connection Card */}
                <div className="bg-surface rounded-3xl border border-slate-100 shadow-card p-8">
                    <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                        <Send className="w-5 h-5 text-slate-400" />
                        Test Connection
                    </h3>

                    <div className="space-y-5">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="text-sm text-amber-800 font-medium flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    For Twilio sandbox: The recipient must first send "join [your-sandbox-keyword]" to the sandbox number before receiving messages.
                                </span>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Test Phone Number
                            </label>
                            <input
                                type="text"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                placeholder="+447123456789"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={handleTest}
                            disabled={isTesting || !formData.twilioAccountSid}
                            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1da851] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Test Message
                                </>
                            )}
                        </button>

                        {/* Test Result */}
                        {testResult && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${testResult.success
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {testResult.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{testResult.message}</span>
                            </div>
                        )}

                        {/* Helpful Links */}
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-sm font-bold text-slate-700 mb-3">Helpful Links</p>
                            <div className="space-y-2">
                                <a
                                    href="https://console.twilio.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Twilio Console
                                </a>
                                <a
                                    href="https://www.twilio.com/docs/whatsapp/sandbox"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    WhatsApp Sandbox Setup
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message History */}
            <div className="bg-surface rounded-3xl border border-slate-100 shadow-card overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        Recent Messages
                    </h3>
                    <button className="text-sm text-brand-600 font-bold hover:text-brand-700 flex items-center gap-1">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {messageHistory && messageHistory.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {messageHistory.map((message) => (
                            <div key={message._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.direction === 'outbound'
                                            ? 'bg-brand-100 text-brand-600'
                                            : 'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            {message.direction === 'outbound' ? (
                                                <ArrowRight className="w-4 h-4" />
                                            ) : (
                                                <MessageCircle className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {message.recipientPhone}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(message.createdAt).toLocaleString('en-GB')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                {message.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs font-medium text-slate-400 uppercase">
                                                    {message.messageType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(message.status)}
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${getStatusColor(message.status)}`}>
                                            {message.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Messages will appear here once you start sending</p>
                    </div>
                )}
            </div>

            {/* Webhook URLs Info */}
            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8">
                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    Webhook Configuration
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                    Configure these webhook URLs in your Twilio Console to receive incoming messages and status updates:
                </p>
                <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-1">Incoming Messages</p>
                        <code className="text-sm font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded">
                            https://your-deployment.convex.site/whatsapp/webhook/incoming
                        </code>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-1">Status Callbacks</p>
                        <code className="text-sm font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded">
                            https://your-deployment.convex.site/whatsapp/webhook/status
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
};
