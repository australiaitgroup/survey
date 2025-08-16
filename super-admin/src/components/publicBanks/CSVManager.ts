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
      formData.append('file', file);
      
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
  
  downloadCSVTemplate(): void {
    const template = `Question Text,Description,Type,Options,Correct Answer,Explanation,Points,Tags,Difficulty
"What is 2 + 2?","Basic math question","single_choice","2|3|4|5","2","The sum of 2 and 2 is 4","1","math|basic","easy"
"Is the sky blue?","True/false question","true_false","True|False","True","The sky appears blue due to light scattering","1","science|nature","easy"
"Select all prime numbers","Multiple correct answers","multiple_choice","2|3|4|5|6","0|1|4","2, 3, and 5 are prime numbers","2","math|prime","medium"
"What is the capital of France?","Text answer question","text","","Paris","Paris is the capital city of France","1","geography|europe","easy"
"How many days in a year?","Number answer question","number","","365","A standard year has 365 days","1","general|time","easy"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'question_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.showSuccess('Template downloaded');
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