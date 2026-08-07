import React from 'react';
import { Check, X } from 'lucide-react';
import { validatePassword } from '../utils/passwordValidator';

interface PasswordStrengthMeterProps {
  password: string;
  showChecklist?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showChecklist = true
}) => {
  if (!password) return null;

  const result = validatePassword(password);

  const getScoreColor = () => {
    switch (result.score) {
      case 'strong':
        return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500 text-amber-400 border-amber-500/30';
      case 'weak':
      default:
        return 'bg-rose-500 text-rose-400 border-rose-500/30';
    }
  };

  const getBarWidths = () => {
    switch (result.score) {
      case 'strong':
        return ['w-full bg-emerald-500', 'w-full bg-emerald-500', 'w-full bg-emerald-500'];
      case 'medium':
        return ['w-full bg-amber-500', 'w-full bg-amber-500', 'w-0 bg-slate-800'];
      case 'weak':
      default:
        return ['w-full bg-rose-500', 'w-0 bg-slate-800', 'w-0 bg-slate-800'];
    }
  };

  const barWidths = getBarWidths();

  return (
    <div className="space-y-3 pt-1 animate-fade-in">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Password Strength:</span>
          <span className={`font-semibold capitalize ${result.score === 'strong' ? 'text-emerald-400' : result.score === 'medium' ? 'text-amber-400' : 'text-rose-400'}`}>
            {result.score}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 h-1.5">
          <div className="h-full rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${barWidths[0]}`} />
          </div>
          <div className="h-full rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${barWidths[1]}`} />
          </div>
          <div className="h-full rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${barWidths[2]}`} />
          </div>
        </div>
      </div>

      {/* Checklist */}
      {showChecklist && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            {result.checks.hasMinLength && result.checks.hasMaxLength ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.checks.hasMinLength && result.checks.hasMaxLength ? 'text-emerald-300' : 'text-slate-400'}>
              8 to 64 characters
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.checks.hasUppercase ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.checks.hasUppercase ? 'text-emerald-300' : 'text-slate-400'}>
              At least one uppercase letter (A-Z)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.checks.hasLowercase ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.checks.hasLowercase ? 'text-emerald-300' : 'text-slate-400'}>
              At least one lowercase letter (a-z)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.checks.hasNumber ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.checks.hasNumber ? 'text-emerald-300' : 'text-slate-400'}>
              At least one number (0-9)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.checks.hasSpecial ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.checks.hasSpecial ? 'text-emerald-300' : 'text-slate-400'}>
              At least one special character (!@#$%^&*)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.checks.hasNoSpaces ? (
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={result.checks.hasNoSpaces ? 'text-emerald-300' : 'text-slate-400'}>
              No spaces
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
