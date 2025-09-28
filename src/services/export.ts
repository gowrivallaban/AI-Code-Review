import type { ReviewComment, PullRequest, Repository } from '../types';

export interface ExportOptions {
  format: 'markdown' | 'text' | 'json';
  includeMetadata: boolean;
  includeRejected: boolean;
  groupByFile: boolean;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export interface SubmissionResult {
  success: boolean;
  message: string;
  submittedComments: number;
  errors?: string[];
}

export class ExportService {
  /**
   * Export review comments to various formats
   */
  exportReview(
    comments: ReviewComment[],
    pullRequest: PullRequest,
    repository: Repository,
    options: ExportOptions = {
      format: 'markdown',
      includeMetadata: true,
      includeRejected: false,
      groupByFile: true,
    }
  ): ExportResult {
    // Filter comments based on options
    const filteredComments = this.filterComments(comments, options);
    
    if (filteredComments.length === 0) {
      throw new Error('No comments to export');
    }

    switch (options.format) {
      case 'markdown':
        return this.exportAsMarkdown(filteredComments, pullRequest, repository, options);
      case 'text':
        return this.exportAsText(filteredComments, pullRequest, repository, options);
      case 'json':
        return this.exportAsJSON(filteredComments, pullRequest, repository, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate a summary of the review for submission
   */
  generateSubmissionSummary(comments: ReviewComment[]): string {
    const acceptedComments = comments.filter(c => c.status === 'accepted');
    
    if (acceptedComments.length === 0) {
      return 'No review comments to submit.';
    }

    const stats = this.getCommentStats(acceptedComments);
    
    let summary = `## Automated Code Review Summary\n\n`;
    summary += `Found **${acceptedComments.length}** issues across **${stats.fileCount}** files:\n\n`;
    
    if (stats.errors > 0) {
      summary += `- 🚨 **${stats.errors}** Critical Issues\n`;
    }
    if (stats.warnings > 0) {
      summary += `- ⚠️ **${stats.warnings}** Warnings\n`;
    }
    if (stats.info > 0) {
      summary += `- ℹ️ **${stats.info}** Suggestions\n`;
    }
    
    summary += `\n---\n\n`;
    
    return summary;
  }

  /**
   * Download exported content as a file
   */
  downloadFile(result: ExportResult): void {
    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Copy content to clipboard
   */
  async copyToClipboard(content: string): Promise<void> {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return;
    }
    
    await navigator.clipboard.writeText(content);
  }

  // Private helper methods

  private filterComments(comments: ReviewComment[], options: ExportOptions): ReviewComment[] {
    let filtered = comments;
    
    // Always include accepted comments
    filtered = filtered.filter(comment => 
      comment.status === 'accepted' || 
      (options.includeRejected && comment.status === 'rejected')
    );
    
    return filtered;
  }

  private exportAsMarkdown(
    comments: ReviewComment[],
    pullRequest: PullRequest,
    repository: Repository,
    options: ExportOptions
  ): ExportResult {
    let content = '';
    
    // Add metadata header
    if (options.includeMetadata) {
      content += this.generateMarkdownHeader(pullRequest, repository);
    }
    
    // Add summary
    content += this.generateSubmissionSummary(comments);
    
    // Add comments
    if (options.groupByFile) {
      content += this.generateMarkdownByFile(comments);
    } else {
      content += this.generateMarkdownByOrder(comments);
    }
    
    // Add footer
    content += this.generateMarkdownFooter();
    
    const filename = `review-${repository.name}-pr${pullRequest.number}-${new Date().toISOString().split('T')[0]}.md`;
    
    return {
      content,
      filename,
      mimeType: 'text/markdown',
    };
  }

  private exportAsText(
    comments: ReviewComment[],
    pullRequest: PullRequest,
    repository: Repository,
    options: ExportOptions
  ): ExportResult {
    let content = '';
    
    // Add metadata header
    if (options.includeMetadata) {
      content += `Code Review Report\n`;
      content += `Repository: ${repository.full_name}\n`;
      content += `Pull Request: #${pullRequest.number} - ${pullRequest.title}\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `${'='.repeat(60)}\n\n`;
    }
    
    // Add comments
    if (options.groupByFile) {
      const commentsByFile = this.groupCommentsByFile(comments);
      
      Object.entries(commentsByFile).forEach(([file, fileComments]) => {
        content += `FILE: ${file}\n`;
        content += `${'-'.repeat(40)}\n`;
        
        fileComments.forEach((comment, index) => {
          content += `${index + 1}. Line ${comment.line} [${comment.severity.toUpperCase()}]\n`;
          content += `   ${comment.content}\n\n`;
        });
        
        content += '\n';
      });
    } else {
      comments.forEach((comment, index) => {
        content += `${index + 1}. ${comment.file}:${comment.line} [${comment.severity.toUpperCase()}]\n`;
        content += `   ${comment.content}\n\n`;
      });
    }
    
    const filename = `review-${repository.name}-pr${pullRequest.number}-${new Date().toISOString().split('T')[0]}.txt`;
    
    return {
      content,
      filename,
      mimeType: 'text/plain',
    };
  }

  private exportAsJSON(
    comments: ReviewComment[],
    pullRequest: PullRequest,
    repository: Repository,
    options: ExportOptions
  ): ExportResult {
    const exportData = {
      metadata: options.includeMetadata ? {
        repository: {
          name: repository.name,
          fullName: repository.full_name,
          url: repository.html_url,
        },
        pullRequest: {
          number: pullRequest.number,
          title: pullRequest.title,
          url: pullRequest.html_url,
          head: pullRequest.head.ref,
          base: pullRequest.base.ref,
        },
        exportedAt: new Date().toISOString(),
        options,
      } : undefined,
      summary: this.getCommentStats(comments),
      comments: comments.map(comment => ({
        id: comment.id,
        file: comment.file,
        line: comment.line,
        content: comment.content,
        severity: comment.severity,
        status: comment.status,
        category: comment.category,
        createdAt: comment.createdAt,
      })),
    };
    
    const content = JSON.stringify(exportData, null, 2);
    const filename = `review-${repository.name}-pr${pullRequest.number}-${new Date().toISOString().split('T')[0]}.json`;
    
    return {
      content,
      filename,
      mimeType: 'application/json',
    };
  }

  private generateMarkdownHeader(pullRequest: PullRequest, repository: Repository): string {
    return `# Code Review Report

**Repository:** [${repository.full_name}](${repository.html_url})  
**Pull Request:** [#${pullRequest.number} - ${pullRequest.title}](${pullRequest.html_url})  
**Branch:** \`${pullRequest.head.ref}\` → \`${pullRequest.base.ref}\`  
**Generated:** ${new Date().toLocaleString()}

---

`;
  }

  private generateMarkdownByFile(comments: ReviewComment[]): string {
    const commentsByFile = this.groupCommentsByFile(comments);
    let content = '';
    
    Object.entries(commentsByFile).forEach(([file, fileComments]) => {
      content += `## 📁 ${file}\n\n`;
      
      fileComments.forEach((comment, index) => {
        const severityEmoji = this.getSeverityEmoji(comment.severity);
        content += `### ${index + 1}. ${severityEmoji} Line ${comment.line} (${comment.severity})\n\n`;
        content += `${comment.content}\n\n`;
        
        if (comment.category) {
          content += `*Category: ${comment.category}*\n\n`;
        }
      });
    });
    
    return content;
  }

  private generateMarkdownByOrder(comments: ReviewComment[]): string {
    let content = '## Review Comments\n\n';
    
    comments.forEach((comment, index) => {
      const severityEmoji = this.getSeverityEmoji(comment.severity);
      content += `### ${index + 1}. ${severityEmoji} ${comment.file}:${comment.line} (${comment.severity})\n\n`;
      content += `${comment.content}\n\n`;
      
      if (comment.category) {
        content += `*Category: ${comment.category}*\n\n`;
      }
    });
    
    return content;
  }

  private generateMarkdownFooter(): string {
    return `---

*This review was generated automatically by GitHub PR Review UI*
`;
  }

  private groupCommentsByFile(comments: ReviewComment[]): Record<string, ReviewComment[]> {
    return comments.reduce((acc, comment) => {
      if (!acc[comment.file]) {
        acc[comment.file] = [];
      }
      acc[comment.file].push(comment);
      return acc;
    }, {} as Record<string, ReviewComment[]>);
  }

  private getCommentStats(comments: ReviewComment[]) {
    const fileCount = new Set(comments.map(c => c.file)).size;
    const errors = comments.filter(c => c.severity === 'error').length;
    const warnings = comments.filter(c => c.severity === 'warning').length;
    const info = comments.filter(c => c.severity === 'info').length;
    
    return { fileCount, errors, warnings, info, total: comments.length };
  }

  private getSeverityEmoji(severity: ReviewComment['severity']): string {
    switch (severity) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }
}

// Export singleton instance
export const exportService = new ExportService();