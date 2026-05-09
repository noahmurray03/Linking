
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error caught by boundary
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Applikationen stötte på ett oväntat problem. Vi har loggat felet och arbetar på att lösa det.";
      let technicalInfo = this.state.error?.message;

      try {
        if (technicalInfo) {
          const parsed = JSON.parse(technicalInfo);
          if (parsed.error && parsed.operationType) {
            if (parsed.error.includes("Missing or insufficient permissions")) {
              displayMessage = "Du har inte behörighet att utföra denna åtgärd. Vänligen kontrollera att du är inloggad med rätt konto.";
            } else {
              displayMessage = `Ett systemfel uppstod vid bearbetning av data (${parsed.operationType}). Försök ladda om sidan.`;
            }
          }
        }
      } catch (e) {
        // Not a JSON error, keep default
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-100 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-4 uppercase tracking-tight">Ett fel uppstod</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              {displayMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Ladda om sidan
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
