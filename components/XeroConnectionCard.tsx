import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Link, Unlink, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface XeroConnectionCardProps {
  compact?: boolean; // For sidebar display
}

export const XeroConnectionCard: React.FC<XeroConnectionCardProps> = ({ compact = false }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionStatus = useQuery(api.xero.oauth.getConnectionStatus);
  const getAuthUrl = useAction(api.xero.oauth.getAuthUrl);
  const disconnect = useMutation(api.xero.oauth.disconnect);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await getAuthUrl();
      if (result.error) {
        setError(result.error);
        setIsConnecting(false);
        return;
      }
      // Redirect to Xero OAuth
      window.location.href = result.url;
    } catch (err) {
      setError('Failed to initiate Xero connection');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Xero? You will need to reconnect to create invoices.')) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);

    try {
      await disconnect();
    } catch (err) {
      setError('Failed to disconnect Xero');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!connectionStatus) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} bg-slate-50 rounded-2xl animate-pulse`}>
        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  if (compact) {
    // Compact version for sidebar
    return (
      <div className="px-4 py-3">
        {connectionStatus.connected ? (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-600 font-medium truncate">{connectionStatus.tenantName}</span>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            <Link className="w-3.5 h-3.5" />
            {isConnecting ? 'Connecting...' : 'Connect Xero'}
          </button>
        )}
      </div>
    );
  }

  // Full card version
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        {/* Xero Logo */}
        <div className="w-12 h-12 bg-[#13B5EA] rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">Xero Integration</h3>
          <p className="text-sm text-slate-500">Create and manage invoices</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {connectionStatus.connected ? (
        <div className="space-y-4">
          {/* Connected status */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div className="flex-1">
              <p className="font-bold text-emerald-900">{connectionStatus.tenantName}</p>
              <p className="text-xs text-emerald-600">
                Connected {connectionStatus.connectedAt
                  ? new Date(connectionStatus.connectedAt).toLocaleDateString('en-GB')
                  : ''}
              </p>
            </div>
          </div>

          {connectionStatus.isExpired && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              Connection expired. Please reconnect.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              {isConnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="flex items-center justify-center gap-2 py-3 px-4 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors text-sm"
            >
              <Unlink className="w-4 h-4" />
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>

          <a
            href="https://go.xero.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Open Xero Dashboard
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Connect your Xero account to create professional invoices directly from your bookings.
          </p>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#13B5EA] hover:bg-[#0ea5d6] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#13B5EA]/20 active:scale-[0.98]"
          >
            <Link className="w-5 h-5" />
            {isConnecting ? 'Connecting to Xero...' : 'Connect to Xero'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            You'll be redirected to Xero to authorize the connection
          </p>
        </div>
      )}
    </div>
  );
};

export default XeroConnectionCard;
