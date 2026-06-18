import React from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '../Button';
import { FieldSuccess, Form, FormActions, FormField } from '../Form';
import { Modal } from '../Modal';
import { PasswordData } from '../hooks/landingShared';

interface ChangePasswordModalProps {
  isOpen: boolean;
  passwordData: PasswordData;
  currentPwdOk: boolean | null;
  currentErr: string;
  newPwdErr: string;
  samePasswordErr: string;
  confirmErr: string;
  isSubmitting: boolean;
  passwordSubmitDisabled: boolean;
  onClose: () => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
}

export function ChangePasswordModal({
  isOpen,
  passwordData,
  currentPwdOk,
  currentErr,
  newPwdErr,
  samePasswordErr,
  confirmErr,
  isSubmitting,
  passwordSubmitDisabled,
  onClose,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: ChangePasswordModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Contraseña" size="md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Ingresa tu contraseña actual y la nueva contraseña
          </p>
        </div>
      </div>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <FormField
          label="Contraseña Actual"
          name="currentPassword"
          type="password"
          value={passwordData.currentPassword}
          onChange={(value) => onCurrentPasswordChange(value as string)}
          placeholder="••••••••"
          required
          error={currentErr}
        />
        {passwordData.currentPassword.trim() && currentPwdOk === true ? (
          <FieldSuccess>Contraseña actual verificada.</FieldSuccess>
        ) : null}

        <FormField
          label="Nueva Contraseña"
          name="newPassword"
          type="password"
          value={passwordData.newPassword}
          onChange={(value) => onNewPasswordChange(value as string)}
          placeholder="••••••••"
          required
          error={passwordData.newPassword.trim() ? samePasswordErr || newPwdErr || undefined : undefined}
        />

        <FormField
          label="Confirmar Nueva Contraseña"
          name="confirmPassword"
          type="password"
          value={passwordData.confirmPassword}
          onChange={(value) => onConfirmPasswordChange(value as string)}
          placeholder="••••••••"
          required
          error={confirmErr || undefined}
        />

        <div className="p-4 bg-accent rounded-lg mb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Mínimo 8 caracteres, una mayúscula, una minúscula, un número y
            no repetir la actual ni ninguna de las últimas 3 contraseñas.
          </p>
        </div>

        <FormActions>
          <Button variant="outline" disabled={isSubmitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={passwordSubmitDisabled}
            icon={<KeyRound className="w-5 h-5" />}
          >
            {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </FormActions>
      </Form>
    </Modal>
  );
}
