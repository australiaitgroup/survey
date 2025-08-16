import { PublicBank, BankUsageData } from '../../types/publicBanks';
import { PublicBanksAPI } from '../../api/publicBanks';

export class BankUsageModal {
  private api: PublicBanksAPI;
  
  // State
  public modalOpen = false;
  public loading = false;
  public selectedBank: PublicBank | null = null;
  public usageData: BankUsageData | null = null;
  
  constructor(api: PublicBanksAPI) {
    this.api = api;
  }
  
  async openModal(bank: PublicBank): Promise<void> {
    this.selectedBank = bank;
    this.modalOpen = true;
    this.usageData = null;
    await this.loadUsageData(bank._id);
  }
  
  closeModal(): void {
    this.modalOpen = false;
    this.selectedBank = null;
    this.usageData = null;
  }
  
  private async loadUsageData(bankId: string): Promise<void> {
    this.loading = true;
    
    try {
      const response = await this.api.getPublicBankUsage(bankId);
      
      if (response.success && response.data) {
        this.usageData = response.data;
      } else {
        this.showError('Failed to load usage data');
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
      this.showError('Failed to load usage data');
    } finally {
      this.loading = false;
    }
  }
  
  getMonthName(monthStr: string): string {
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  private showError(message: string): void {
    console.error('Error:', message);
  }
}