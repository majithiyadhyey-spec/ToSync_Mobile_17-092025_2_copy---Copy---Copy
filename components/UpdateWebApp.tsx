

import React, { useState, useRef } from 'react';
import { useI18n } from '../context/I18nContext';
import { useFormworkData } from '../context/FormworkDataContext';
import { useAuth } from '../context/AuthContext';
import { Project, Task, User, AuditLog, AppIntegrations } from '../types';
import ConfirmationModal from './ConfirmationModal';
import RestoringOverlay from './RestoringOverlay';
import DatabaseIcon from './icons/DatabaseIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import { encryptData, decryptData } from '../utils/cryptoUtils';
import EncryptionPasswordModal from './EncryptionPasswordModal';

interface AppData {
    projects: Project[];
    tasks: Task[];
    users: User[];
    auditLogs?: AuditLog[];
    integrations?: AppIntegrations;
}

// Interface for the encrypted file structure
interface EncryptedPayload {
    salt: string;
    iv: string;
    data: string;
}

const UpdateWebApp: React.FC = () => {
    const { t } = useI18n();
    
    const { projects, tasks, users, auditLogs, integrations, restoreBackup, addAuditLog } = useFormworkData();
    const { currentUser, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupDataToImport, setBackupDataToImport] = useState<AppData | null>(null);

    // New state for encryption/decryption modals
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordModalMode, setPasswordModalMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [encryptedPayloadToImport, setEncryptedPayloadToImport] = useState<EncryptedPayload | null>(null);

    const handleExport = () => {
        setPasswordModalMode('encrypt');
        setIsPasswordModalOpen(true);
    };

    const handleEncryptAndExport = async (password: string) => {
        setIsPasswordModalOpen(false);
        try {
            const dataToExport: AppData = { projects, tasks, users, auditLogs, integrations };
            const encryptedPayload = await encryptData(password, JSON.stringify(dataToExport));
            const blob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tosync_backup_${new Date().toISOString().split('T')[0]}.json.encrypted`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if(currentUser) {
                addAuditLog({
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    action: 'data_export',
                    targetType: 'System'
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('An error occurred during export.');
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsed = JSON.parse(text);
                if ('salt' in parsed && 'iv' in parsed && 'data' in parsed) {
                    // Encrypted file
                    setEncryptedPayloadToImport(parsed);
                    setPasswordModalMode('decrypt');
                    setIsPasswordModalOpen(true);
                } else if ('projects' in parsed && 'tasks' in parsed && 'users' in parsed) {
                    // Unencrypted JSON file
                    setBackupDataToImport(parsed);
                    setIsConfirmModalOpen(true);
                } else {
                    throw new Error('Invalid backup file format.');
                }
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Invalid file. Please select a valid backup file.');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    const handleDecryptAndImport = async (password: string) => {
        if (!encryptedPayloadToImport) return;
        setIsPasswordModalOpen(false);
        try {
            const decryptedString = await decryptData(password, encryptedPayloadToImport);
            const parsedData = JSON.parse(decryptedString);
            setBackupDataToImport(parsedData);
            setIsConfirmModalOpen(true);
        } catch (error) {
            console.error('Decryption failed:', error);
            alert('Decryption failed. Please check your password and try again.');
        } finally {
            setEncryptedPayloadToImport(null);
        }
    };

    const handleRestore = async () => {
        if (!backupDataToImport) return;
        setIsConfirmModalOpen(false);
        setIsRestoring(true);
        try {
            // FIX: Ensure the backup data conforms to the stricter AppData type by providing default values for optional properties before passing it to the restore function.
            const completeBackupData = {
                ...backupDataToImport,
                auditLogs: backupDataToImport.auditLogs || [],
                integrations: backupDataToImport.integrations || {
                    teams: { webhookUrl: '', notifications: { taskCreated: true, taskInProgress: true, taskCompleted: true } },
                    timezone: 'Asia/Kolkata',
                }
            };
            await restoreBackup(completeBackupData);
            if(currentUser) {
                addAuditLog({
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    action: 'data_import',
                    targetType: 'System'
                });
            }
            // Wait a moment for the user to see the message, then log out.
            setTimeout(() => {
                logout();
            }, 3000);
        } catch (error) {
            console.error('Restore failed:', error);
            alert('An error occurred during restore.');
            setIsRestoring(false);
        }
    };

    return (
        <>
            {isRestoring && <RestoringOverlay />}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <DatabaseIcon className="w-7 h-7 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('dataBackup_title_json')}</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('dataBackup_description')}</p>

                <div className="space-y-6">
                    {/* Export Section */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('dataBackup_export_title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{t('dataBackup_export_desc')}</p>
                        <button
                            onClick={handleExport}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            {t('dataBackup_export_button')}
                        </button>
                    </div>

                    {/* Import Section */}
                    <div className="p-4 border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h3 className="font-semibold text-red-800 dark:text-red-200">{t('dataBackup_import_title')}</h3>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1 mb-3">{t('dataBackup_import_warning')}</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".json,.json.encrypted"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                            <UploadIcon className="w-5 h-5" />
                            {t('dataBackup_import_button')}
                        </button>
                    </div>
                </div>
            </div>

            {isConfirmModalOpen && (
                <ConfirmationModal
                    title={t('dataBackup_confirm_title')}
                    onConfirm={handleRestore}
                    onClose={() => setIsConfirmModalOpen(false)}
                    confirmText={t('dataBackup_confirm_button')}
                    confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
                >
                    <p>{t('dataBackup_confirm_message')}</p>
                </ConfirmationModal>
            )}

            {isPasswordModalOpen && (
                <EncryptionPasswordModal
                    mode={passwordModalMode}
                    onClose={() => {
                        setIsPasswordModalOpen(false);
                        setEncryptedPayloadToImport(null);
                    }}
                    onSubmit={passwordModalMode === 'encrypt' ? handleEncryptAndExport : handleDecryptAndImport}
                />
            )}
        </>
    );
};

export default UpdateWebApp;
