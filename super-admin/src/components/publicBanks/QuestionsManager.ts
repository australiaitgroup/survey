import { Question, QuestionFormData } from '../../types/publicBanks';
import { PaginationParams, FilterParams } from '../../types';
import { PublicBanksAPI } from '../../api/publicBanks';

export class QuestionsManager {
  private api: PublicBanksAPI;
  private bankId: string = '';
  
  // State
  public questions: Question[] = [];
  public loading = false;
  public questionDrawerOpen = false;
  public questionEditMode = false;
  public editingQuestionIndex: number | null = null;
  
  // Pagination
  public pagination: PaginationParams = {
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  };
  
  // Filters
  public filters: FilterParams & {
    difficulty?: string;
    tags?: string;
  } = {
    search: '',
    difficulty: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  // Form data
  public questionForm: QuestionFormData = {
    text: '',
    description: '',
    type: 'single_choice',
    options: ['', ''],
    correctAnswer: null,
    explanation: '',
    points: 1,
    tags: [],
    difficulty: 'medium'
  };
  
  constructor(api: PublicBanksAPI) {
    this.api = api;
  }
  
  setBankId(bankId: string): void {
    this.bankId = bankId;
  }
  
  async loadQuestions(): Promise<void> {
    if (!this.bankId) {
      console.error('Bank ID not set');
      return;
    }
    
    this.loading = true;
    try {
      const params = {
        ...this.filters,
        page: this.pagination.page,
        limit: this.pagination.limit
      };
      
      const response = await this.api.getPublicBankQuestions(this.bankId, params);
      
      if (response.success && response.data) {
        this.questions = response.data.questions || [];
        this.pagination = {
          ...this.pagination,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        };
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      this.showError('Failed to load questions');
    } finally {
      this.loading = false;
    }
  }
  
  openAddQuestionDrawer(): void {
    this.questionEditMode = false;
    this.editingQuestionIndex = null;
    this.resetQuestionForm();
    this.questionDrawerOpen = true;
  }
  
  openEditQuestionDrawer(question: Question, index: number): void {
    this.questionEditMode = true;
    this.editingQuestionIndex = index;
    
    this.questionForm = {
      text: question.text,
      description: question.description || '',
      type: question.type,
      options: question.options ? [...question.options] : ['', ''],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      points: question.points,
      tags: [...question.tags],
      difficulty: question.difficulty
    };
    
    this.questionDrawerOpen = true;
  }
  
  closeQuestionDrawer(): void {
    this.questionDrawerOpen = false;
    this.questionEditMode = false;
    this.editingQuestionIndex = null;
    this.resetQuestionForm();
  }
  
  async saveQuestion(): Promise<void> {
    try {
      if (!this.validateQuestionForm()) {
        return;
      }
      
      const questionData = this.prepareQuestionData();
      let response;
      
      if (this.questionEditMode && this.editingQuestionIndex !== null) {
        response = await this.api.updatePublicBankQuestion(
          this.bankId, 
          this.editingQuestionIndex, 
          questionData
        );
      } else {
        response = await this.api.addPublicBankQuestion(this.bankId, questionData);
      }
      
      if (response.success) {
        this.showSuccess(this.questionEditMode ? 'Question updated' : 'Question added');
        this.closeQuestionDrawer();
        await this.loadQuestions();
      } else {
        this.showError(response.error || 'Failed to save question');
      }
    } catch (error) {
      console.error('Failed to save question:', error);
      this.showError('Failed to save question');
    }
  }
  
  async deleteQuestion(index: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }
    
    try {
      const response = await this.api.deletePublicBankQuestion(this.bankId, index);
      
      if (response.success) {
        this.showSuccess('Question deleted');
        await this.loadQuestions();
      } else {
        this.showError(response.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
      this.showError('Failed to delete question');
    }
  }
  
  async duplicateQuestion(index: number): Promise<void> {
    try {
      const response = await this.api.duplicatePublicBankQuestion(this.bankId, index);
      
      if (response.success) {
        this.showSuccess('Question duplicated');
        await this.loadQuestions();
      } else {
        this.showError(response.error || 'Failed to duplicate question');
      }
    } catch (error) {
      console.error('Failed to duplicate question:', error);
      this.showError('Failed to duplicate question');
    }
  }
  
  onQuestionTypeChange(): void {
    const type = this.questionForm.type;
    
    if (type === 'true_false') {
      this.questionForm.options = ['True', 'False'];
      this.questionForm.correctAnswer = 'True';
    } else if (type === 'text' || type === 'number') {
      this.questionForm.options = [];
      this.questionForm.correctAnswer = '';
    } else {
      if (!this.questionForm.options || this.questionForm.options.length < 2) {
        this.questionForm.options = ['', ''];
      }
    }
  }
  
  addOption(): void {
    if (!this.questionForm.options) {
      this.questionForm.options = [];
    }
    
    if (this.questionForm.options.length < 10) {
      this.questionForm.options.push('');
    }
  }
  
  removeOption(index: number): void {
    if (this.questionForm.options && this.questionForm.options.length > 2) {
      this.questionForm.options.splice(index, 1);
      
      // Reset correct answer if it was the removed option
      if (this.questionForm.type === 'single_choice' && 
          this.questionForm.correctAnswer === index) {
        this.questionForm.correctAnswer = null;
      } else if (this.questionForm.type === 'multiple_choice' && 
                 Array.isArray(this.questionForm.correctAnswer)) {
        this.questionForm.correctAnswer = this.questionForm.correctAnswer
          .filter((i: number) => i !== index)
          .map((i: number) => i > index ? i - 1 : i);
      }
    }
  }
  
  addQuestionTag(): void {
    const input = document.getElementById('question-tag-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      if (!this.questionForm.tags.includes(input.value.trim())) {
        this.questionForm.tags.push(input.value.trim());
        input.value = '';
      }
    }
  }
  
  removeQuestionTag(index: number): void {
    this.questionForm.tags.splice(index, 1);
  }
  
  debounceQuestionsSearch(): void {
    setTimeout(() => {
      this.loadQuestions();
    }, 300);
  }
  
  getQuestionsVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.pagination.page - halfVisible);
    let end = Math.min(this.pagination.pages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  async goToPage(page: number): Promise<void> {
    this.pagination.page = page;
    await this.loadQuestions();
  }
  
  private resetQuestionForm(): void {
    this.questionForm = {
      text: '',
      description: '',
      type: 'single_choice',
      options: ['', ''],
      correctAnswer: null,
      explanation: '',
      points: 1,
      tags: [],
      difficulty: 'medium'
    };
  }
  
  private validateQuestionForm(): boolean {
    if (!this.questionForm.text.trim()) {
      this.showError('Question text is required');
      return false;
    }
    
    const type = this.questionForm.type;
    
    if ((type === 'single_choice' || type === 'multiple_choice') && 
        (!this.questionForm.options || this.questionForm.options.length < 2)) {
      this.showError('At least 2 options are required');
      return false;
    }
    
    if (type === 'single_choice' && this.questionForm.correctAnswer === null) {
      this.showError('Please select the correct answer');
      return false;
    }
    
    if (type === 'multiple_choice' && 
        (!Array.isArray(this.questionForm.correctAnswer) || 
         this.questionForm.correctAnswer.length === 0)) {
      this.showError('Please select at least one correct answer');
      return false;
    }
    
    return true;
  }
  
  private prepareQuestionData(): Question {
    const data: Question = {
      text: this.questionForm.text.trim(),
      type: this.questionForm.type,
      points: this.questionForm.points,
      tags: this.questionForm.tags,
      difficulty: this.questionForm.difficulty
    };
    
    if (this.questionForm.description?.trim()) {
      data.description = this.questionForm.description.trim();
    }
    
    if (this.questionForm.explanation?.trim()) {
      data.explanation = this.questionForm.explanation.trim();
    }
    
    if (this.questionForm.type === 'single_choice' || 
        this.questionForm.type === 'multiple_choice' || 
        this.questionForm.type === 'true_false') {
      data.options = this.questionForm.options?.filter(opt => opt.trim()) || [];
      data.correctAnswer = this.questionForm.correctAnswer;
    }
    
    return data;
  }
  
  private showSuccess(message: string): void {
    console.log('Success:', message);
  }
  
  private showError(message: string): void {
    console.error('Error:', message);
  }
}