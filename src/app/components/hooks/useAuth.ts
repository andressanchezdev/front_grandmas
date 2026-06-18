import { useEffect, useMemo, useState } from 'react';
import { toast } from '../AlertDialog';
import { api, newPasswordPolicyMessage } from '../../services/api';
import { PasswordData, UserData, createPasswordDefaults } from './landingShared';

interface UseLandingAuthOptions {
  user?: UserData;
  onLogout?: () => void;
}

export function useLandingAuth({ user, onLogout }: UseLandingAuthOptions) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>(createPasswordDefaults);
  const [currentPwdOk, setCurrentPwdOk] = useState<boolean | null>(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const pwd = passwordData.currentPassword.trim();
    if (!pwd || !user) {
      setCurrentPwdOk(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      api.auth
        .verifyCurrentPassword(pwd)
        .then((ok) => {
          if (!cancelled) setCurrentPwdOk(ok);
        })
        .catch(() => {
          if (!cancelled) setCurrentPwdOk(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [passwordData.currentPassword, user]);

  const resetPasswordState = () => {
    setPasswordData(createPasswordDefaults());
    setCurrentPwdOk(null);
  };

  const newPwdErr = useMemo(
    () => newPasswordPolicyMessage(passwordData.newPassword),
    [passwordData.newPassword]
  );

  const samePasswordErr =
    passwordData.currentPassword.trim() &&
    passwordData.newPassword.trim() &&
    passwordData.currentPassword === passwordData.newPassword
      ? 'La nueva contraseña debe ser diferente a la actual.'
      : '';

  const confirmErr =
    passwordData.confirmPassword.trim() && passwordData.newPassword !== passwordData.confirmPassword
      ? 'Las contraseñas nuevas no coinciden.'
      : '';

  const currentErr =
    passwordData.currentPassword.trim() && currentPwdOk === false
      ? 'La contraseña actual no es correcta.'
      : '';

  const passwordSubmitDisabled =
    !!newPwdErr ||
    !!samePasswordErr ||
    !!confirmErr ||
    !!currentErr ||
    isPasswordSubmitting ||
    currentPwdOk !== true ||
    !passwordData.currentPassword.trim() ||
    !passwordData.newPassword.trim() ||
    !passwordData.confirmPassword.trim();

  const openProfile = () => {
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
  };

  const openChangePassword = () => {
    setIsProfileOpen(false);
    setIsChangePasswordOpen(true);
  };

  const closeChangePassword = () => {
    setIsChangePasswordOpen(false);
    setIsProfileOpen(true);
    resetPasswordState();
  };

  const submitChangePassword = async () => {
    if (passwordSubmitDisabled) return;

    try {
      setIsPasswordSubmitting(true);
      await api.auth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      toast.success('Contraseña actualizada');
      setIsChangePasswordOpen(false);
      setIsProfileOpen(true);
      resetPasswordState();
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña';
      const msg = rawMsg.includes('ultimas 3')
        ? 'La nueva contraseña no puede coincidir con ninguna de tus últimas 3 contraseñas.'
        : rawMsg.includes('debe ser diferente a la contraseña actual')
          ? 'La nueva contraseña no puede ser igual a tu contraseña actual.'
          : rawMsg;
      toast.error(msg);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutDialogOpen(false);
    onLogout?.();
  };

  return {
    isProfileOpen,
    isChangePasswordOpen,
    isPasswordSubmitting,
    passwordData,
    setPasswordData,
    currentPwdOk,
    isLogoutDialogOpen,
    setIsLogoutDialogOpen,
    newPwdErr,
    samePasswordErr,
    confirmErr,
    currentErr,
    passwordSubmitDisabled,
    openProfile,
    closeProfile,
    openChangePassword,
    closeChangePassword,
    submitChangePassword,
    handleLogoutClick,
    handleConfirmLogout,
  };
}
