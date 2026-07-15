import { useCallback, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

export function useUpdateFlow() {
  const setUpdateInfo = useAppStore((s) => s.setUpdateInfo);
  const setDownloadProgress = useAppStore((s) => s.setDownloadProgress);
  const setUpdateDownloaded = useAppStore((s) => s.setUpdateDownloaded);
  const setUpdateError = useAppStore((s) => s.setUpdateError);
  const updateDownloaded = useAppStore((s) => s.updateDownloaded);
  const updateInfo = useAppStore((s) => s.updateInfo);
  const downloadProgress = useAppStore((s) => s.downloadProgress);

  useEffect(() => {
    const unsubAvailable = window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      const { autoUpdate: auto } = useAppStore.getState();
      if (auto) {
        window.electronAPI.downloadUpdate();
      }
    });
    const unsubProgress = window.electronAPI.onDownloadProgress((percent) => {
      setDownloadProgress(percent);
    });
    const unsubDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateDownloaded(true);
      setUpdateInfo(info);
    });
    const unsubError = window.electronAPI.onUpdateError((message) => {
      setUpdateError(message);
    });
    const unsubNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      // Nothing to show
    });

    window.electronAPI.checkForUpdates();

    return () => {
      unsubAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
      unsubNotAvailable();
    };
  }, [setUpdateInfo, setDownloadProgress, setUpdateDownloaded, setUpdateError]);

  const handleUpdateNow = useCallback(() => {
    setUpdateError(null);
    if (updateDownloaded) {
      window.electronAPI.installUpdate();
    } else {
      window.electronAPI.downloadUpdate().then((result) => {
        if (!result.ok) setUpdateError(`Download failed: ${result.error.message}`);
      });
    }
  }, [updateDownloaded, setUpdateError]);

  const handleSkipUpdate = useCallback(() => {
    setUpdateInfo(null);
    setDownloadProgress(0);
    setUpdateDownloaded(false);
  }, [setUpdateInfo, setDownloadProgress, setUpdateDownloaded]);

  const handleDismissUpdate = useCallback(() => {
    setUpdateInfo(null);
    setDownloadProgress(0);
    setUpdateDownloaded(false);
  }, [setUpdateInfo, setDownloadProgress, setUpdateDownloaded]);

  return {
    updateInfo,
    downloadProgress,
    updateDownloaded,
    handleUpdateNow,
    handleSkipUpdate,
    handleDismissUpdate,
  };
}
