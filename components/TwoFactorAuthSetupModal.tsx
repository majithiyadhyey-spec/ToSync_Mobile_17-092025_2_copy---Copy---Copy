


import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import { generateSecret, verifyToken } from '../utils/totp';
import XIcon from './icons/XIcon';
import QrCodeIcon from './icons/QrCodeIcon';

interface TwoFactorAuthSetupModalProps {
    user: User;
    onClose: () => void;
}

const TwoFactorAuthSetupModal: React.FC<TwoFactorAuthSetupModalProps> = ({ user, onClose }) => {
    const { t } = useI18n();
    const { updateUser } = useFormworkData();
    const [secret, setSecret] = useState(() => generateSecret());
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');

    const qrCodeUrl = useMemo(() => {
        const issuer = encodeURIComponent('TOSync');
        const account = encodeURIComponent(user.name);
        const uri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
    }, [secret, user.name]);

    const handleVerifyAndEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (await verifyToken(secret, verificationCode)) {
            const updatedUser: User = { ...user, isTwoFactorEnabled: true, twoFactorSecret: secret };
            updateUser(updatedUser);
            alert(t('twoFactor_setup_success'));
            onClose();
        } else {
            setError(t('twoFactor_setup_error_invalid'));
        }
    };

    const handleDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (user.twoFactorSecret && await verifyToken(user.twoFactorSecret, verificationCode)) {
            const updatedUser: User = { ...user, isTwoFactorEnabled: false, twoFactorSecret: undefined };
            updateUser(updatedUser);
            onClose();
        } else {
             setError(t('twoFactor_prompt_error_invalid'));
        }
    };

    const inputClasses = "block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";

    if (user.isTwoFactorEnabled) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
                <form onSubmit={handleDisable} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('twoFactor_disable_confirm_title')}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('twoFactor_disable_confirm_message')}</p>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            className={`${inputClasses} text-center text-lg tracking-widest`}
                            autoFocus
                            required
                        />
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 font-semibold">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold">{t('twoFactor_disable_button')}</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <form onSubmit={handleVerifyAndEnable} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('twoFactor_setup_title')}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('twoFactor_setup_step1')}</p>
                        <div className="bg-white p-2 rounded-lg inline-block">
                           <img src={qrCodeUrl} alt="2FA QR Code" width="200" height="200" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('twoFactor_setup_step2')}</p>
                         {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            placeholder="123456"
                            className={`${inputClasses} text-center text-lg tracking-widest`}
                            required
                            autoFocus
                        />
                    </div>
                </div>
                 <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 font-semibold">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">{t('twoFactor_setup_verify_button')}</button>
                </div>
            </form>
        </div>
    );
};

export default TwoFactorAuthSetupModal;
