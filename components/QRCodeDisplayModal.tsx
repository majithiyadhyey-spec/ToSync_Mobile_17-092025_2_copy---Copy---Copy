import React, { useState, useMemo } from 'react';
import XIcon from './icons/XIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import { useI18n } from '../context/I18nContext';
import CopyIcon from './icons/CopyIcon';
import DownloadIcon from './icons/DownloadIcon';
import ShareIcon from './icons/ShareIcon';

interface QRCodeDisplayModalProps {
  taskId: string;
  taskName: string;
  onClose: () => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors w-24"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
);


const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({ taskId, taskName, onClose }) => {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState('');
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(taskId)}`;
  const canShare = useMemo(() => typeof navigator.share === 'function', []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code image.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${taskId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      showFeedback(t('qrCodeDownloadError'));
    }
  };

  const handleCopy = async () => {
    if (!navigator.clipboard?.write) {
      showFeedback(t('qrCodeCopyError'));
      return;
    }
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code image.');
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      showFeedback(t('qrCodeCopied'));
    } catch (err) {
      console.error('Copy failed:', err);
      showFeedback(t('qrCodeCopyError'));
    }
  };
  
  const handleShare = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code image.');
      const blob = await response.blob();
      const file = new File([blob], `qrcode-${taskId}.png`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('qrCodeModal_title'),
          text: t('qrCodeModal_shareText', { taskName: taskName }),
        });
      } else {
        showFeedback(t('sharingNotSupported'));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        showFeedback(t('qrCodeCopyError')); // Re-use generic error
      }
    }
  };


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md text-center">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <QrCodeIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('qrCodeModal_title')}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center gap-6">
          <div className="bg-white p-4 rounded-lg min-w-[200px] min-h-[200px]">
            <img src={qrCodeUrl} alt={`QR Code for ${taskName}`} style={{minHeight: '200px', width: '200px', objectFit: 'contain', imageRendering: 'pixelated'}} />
          </div>

          <div className="flex items-center justify-center gap-4 w-full">
            <ActionButton icon={<CopyIcon className="w-5 h-5"/>} label={t('copy')} onClick={handleCopy} />
            <ActionButton icon={<DownloadIcon className="w-5 h-5"/>} label={t('download')} onClick={handleDownload} />
            {canShare && <ActionButton icon={<ShareIcon className="w-5 h-5"/>} label={t('share')} onClick={handleShare} />}
          </div>
          
          <div className="h-5">
            {feedback && <p className="text-sm text-center text-green-600 dark:text-green-400">{feedback}</p>}
          </div>

          <div className="text-left w-full">
            <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">{t('qrCodeModal_task')}</span> {taskName}</p>
            <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">{t('qrCodeModal_id')}</span> <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">{taskId}</span></p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">{t('qrCodeModal_instruction')}</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">
              {t('done')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplayModal;