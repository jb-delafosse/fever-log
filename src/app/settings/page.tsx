'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/presentation/components/auth/protected-route';
import { useAuth } from '@/presentation/contexts/auth-context';
import { useSync } from '@/presentation/hooks/use-sync';
import {
  ExportData,
  eventsToCSV,
  eventsToJSON,
  downloadFile,
  ImportData,
} from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export default function SettingsPage() {
  const { logout } = useAuth();
  const { status, sync, isOnline } = useSync();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSync = async () => {
    setSyncMessage(null);
    try {
      await sync();
      setSyncMessage('Sync completed successfully');
    } catch {
      setSyncMessage('Sync failed. Will retry automatically.');
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const useCase = new ExportData(eventRepository);
      const result = await useCase.execute();
      const json = eventsToJSON(result);
      const filename = `fever-log-export-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(json, filename, 'application/json');
      setExportMessage(`Exported ${result.totalCount} events to ${filename}`);
    } catch (error) {
      setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const useCase = new ExportData(eventRepository);
      const result = await useCase.execute();
      const csv = eventsToCSV(result.events);
      const filename = `fever-log-export-${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csv, filename, 'text/csv');
      setExportMessage(`Exported ${result.totalCount} events to ${filename}`);
    } catch (error) {
      setExportMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    event.target.value = '';

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setImportMessage({ type: 'error', text: 'Please select a JSON file' });
      return;
    }

    setIsImporting(true);
    setImportMessage(null);

    try {
      const content = await file.text();
      const useCase = new ImportData(eventRepository);
      const result = await useCase.execute({
        jsonContent: content,
        mode: 'merge', // Default to merge mode
      });

      if (result.success) {
        setImportMessage({
          type: 'success',
          text: `Imported ${result.importedCount} events${result.skippedCount > 0 ? `, skipped ${result.skippedCount} duplicates` : ''}`,
        });
      } else {
        setImportMessage({
          type: 'error',
          text: `Import completed with errors: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`,
        });
      }
    } catch (error) {
      setImportMessage({
        type: 'error',
        text: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReplaceImport = async () => {
    if (!confirm('This will DELETE all existing data and replace it with the imported data. This cannot be undone. Continue?')) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportMessage(null);

      try {
        const content = await file.text();
        const useCase = new ImportData(eventRepository);
        const result = await useCase.execute({
          jsonContent: content,
          mode: 'replace',
        });

        if (result.success) {
          setImportMessage({
            type: 'success',
            text: `Replaced all data with ${result.importedCount} events`,
          });
        } else {
          setImportMessage({
            type: 'error',
            text: `Import failed: ${result.errors.slice(0, 3).join(', ')}`,
          });
        }
      } catch (error) {
        setImportMessage({
          type: 'error',
          text: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your data and preferences
                </p>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6 max-w-md">
          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync</CardTitle>
              <CardDescription>
                Synchronize data across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <span className={`text-sm font-medium ${
                  status === 'idle' ? 'text-green-600' :
                  status === 'syncing' ? 'text-blue-600' :
                  status === 'error' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {status === 'idle' ? 'Synced' :
                   status === 'syncing' ? 'Syncing...' :
                   status === 'error' ? 'Error' :
                   'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection:</span>
                <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Button
                onClick={handleManualSync}
                disabled={status === 'syncing' || !isOnline}
                className="w-full"
                variant="outline"
              >
                {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </Button>
              {syncMessage && (
                <p className="text-sm text-muted-foreground text-center">
                  {syncMessage}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Data syncs automatically every 30 seconds when online.
              </p>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Data</CardTitle>
              <CardDescription>
                Download your fever log data for backup or to share with your doctor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExportJSON}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? 'Exporting...' : 'Export as JSON'}
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </Button>
              {exportMessage && (
                <p className="text-sm text-muted-foreground text-center">
                  {exportMessage}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                JSON format is best for backup and restore. CSV format works with spreadsheet applications.
              </p>
            </CardContent>
          </Card>

          {/* Data Import */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Data</CardTitle>
              <CardDescription>
                Restore from a backup or import data from another device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelected}
                className="hidden"
              />
              <Button
                onClick={handleImportClick}
                disabled={isImporting}
                className="w-full"
                variant="outline"
              >
                {isImporting ? 'Importing...' : 'Import JSON (Merge)'}
              </Button>
              <Button
                onClick={handleReplaceImport}
                disabled={isImporting}
                className="w-full"
                variant="outline"
              >
                {isImporting ? 'Importing...' : 'Import JSON (Replace All)'}
              </Button>
              {importMessage && (
                <p className={`text-sm text-center ${importMessage.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                  {importMessage.text}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                <strong>Merge:</strong> Adds new events, skips duplicates.<br />
                <strong>Replace:</strong> Deletes all existing data first.
              </p>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Fever Log</strong></p>
              <p className="text-muted-foreground">
                A local-first application for tracking PFAPA fever episodes, symptoms, and treatments.
              </p>
              <p className="text-muted-foreground">
                Your data is stored locally on this device and works offline.
              </p>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
              >
                Log Out
              </Button>
              <p className="text-xs text-muted-foreground">
                To change the password, update the AUTH_PASSWORD environment variable on the server and restart.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
