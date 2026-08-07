export interface PasswordValidationResult {
  isValid: boolean;
  score: 'weak' | 'medium' | 'strong';
  checks: {
    hasMinLength: boolean;
    hasMaxLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    hasNoSpaces: boolean;
  };
  errors: string[];
}

export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[^\s]{8,64}$/;

export const validatePassword = (password: string): PasswordValidationResult => {
  const checks = {
    hasMinLength: password.length >= 8,
    hasMaxLength: password.length <= 64,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasNoSpaces: !/\s/.test(password)
  };

  const errors: string[] = [];
  if (!checks.hasMinLength) errors.push('Minimum 8 characters');
  if (!checks.hasMaxLength) errors.push('Maximum 64 characters');
  if (!checks.hasUppercase) errors.push('At least one uppercase letter');
  if (!checks.hasLowercase) errors.push('At least one lowercase letter');
  if (!checks.hasNumber) errors.push('At least one number');
  if (!checks.hasSpecial) errors.push('At least one special character');
  if (!checks.hasNoSpaces) errors.push('No spaces allowed');

  const isValid = Object.values(checks).every(Boolean);

  // Score calculation
  const passedCount = [
    checks.hasMinLength && checks.hasMaxLength,
    checks.hasUppercase,
    checks.hasLowercase,
    checks.hasNumber,
    checks.hasSpecial,
    checks.hasNoSpaces
  ].filter(Boolean).length;

  let score: 'weak' | 'medium' | 'strong' = 'weak';
  if (isValid) {
    score = 'strong';
  } else if (passedCount >= 4) {
    score = 'medium';
  }

  return {
    isValid,
    score,
    checks,
    errors
  };
};
