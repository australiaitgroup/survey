import { CSVImportResult } from '../../types/publicBanks';
import { PublicBanksAPI } from '../../api/publicBanks';

export class CSVManager {
  private api: PublicBanksAPI;
  private bankId: string = '';

  // State
  public csvImportModalOpen = false;
  public csvImportResults: CSVImportResult | null = null;
  public importing = false;
  public exporting = false;

  constructor(api: PublicBanksAPI) {
    this.api = api;
  }

  setBankId(bankId: string): void {
    this.bankId = bankId;
  }

  openCSVImportModal(): void {
    this.csvImportModalOpen = true;
    this.csvImportResults = null;
  }

  closeCSVImportModal(): void {
    this.csvImportModalOpen = false;
    this.csvImportResults = null;
  }

  async importCSV(file: File): Promise<void> {
    if (!this.bankId) {
      this.showError('Bank ID not set');
      return;
    }

    if (!file) {
      this.showError('Please select a CSV file');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showError('Please select a valid CSV file');
      return;
    }

    this.importing = true;

    try {
      const formData = new FormData();
      // Align field name with backend expectation (`csvFile`)
      formData.append('csvFile', file);

      const response = await this.api.importPublicBankCSV(this.bankId, formData);

      if (response.success && response.data) {
        this.csvImportResults = {
          success: true,
          imported: response.data.imported || 0,
          failed: response.data.failed || 0,
          errors: response.data.errors
        };

        if (response.data.imported > 0) {
          this.showSuccess(`Successfully imported ${response.data.imported} questions`);

          // Trigger questions reload after successful import
          if (this.onQuestionsReload) {
            this.onQuestionsReload();
          }
        }

        if (response.data.failed > 0) {
          this.showWarning(`Failed to import ${response.data.failed} questions`);
        }
      } else {
        this.csvImportResults = {
          success: false,
          imported: 0,
          failed: 0,
          errors: [response.error || 'Import failed']
        };
        this.showError(response.error || 'Failed to import CSV');
      }
    } catch (error) {
      console.error('CSV import error:', error);
      this.csvImportResults = {
        success: false,
        imported: 0,
        failed: 0,
        errors: ['An unexpected error occurred during import']
      };
      this.showError('Failed to import CSV file');
    } finally {
      this.importing = false;
    }
  }

  async exportCSV(_bankTitle: string): Promise<void> {
    if (!this.bankId) {
      this.showError('Bank ID not set');
      return;
    }

    this.exporting = true;

    try {
      const result = await this.api.exportPublicBankCSV(this.bankId);

      if (result.success) {
        this.showSuccess(`Exported questions to ${result.filename}`);
      } else {
        this.showError('Failed to export CSV');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      this.showError('Failed to export CSV file');
    } finally {
      this.exporting = false;
    }
  }

  async downloadCSVTemplate(): Promise<void> {
    try {
      const token = localStorage.getItem('sa_token');
      const response = await fetch(`/api/sa/public-banks/csv-template/download?ts=${Date.now()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) {
        this.showError('Failed to download template');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question_bank_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.showSuccess('Template downloaded');
    } catch (e) {
      this.showError('Failed to download template');
    }
  }

  // Callback for questions reload
  public onQuestionsReload?: () => void;

  private showSuccess(message: string): void {
    console.log('Success:', message);
  }

  private showWarning(message: string): void {
    console.warn('Warning:', message);
  }

  private showError(message: string): void {
    console.error('Error:', message);
  }
}
