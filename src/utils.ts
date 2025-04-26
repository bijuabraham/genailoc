import * as vscode from 'vscode';
import * as path from 'path';
import * as minimatch from 'minimatch';

/**
 * Count the number of lines added in a document change event
 */
export function countAddedLines(event: vscode.TextDocumentChangeEvent): number {
    let addedLines = 0;
    
    for (const change of event.contentChanges) {
        // Count the number of newlines in the added text
        const newLineCount = (change.text.match(/\n/g) || []).length;
        
        // If text was replaced, subtract the number of lines that were removed
        const rangeLineCount = change.range.end.line - change.range.start.line;
        
        // Net lines added
        const netLinesAdded = newLineCount - rangeLineCount;
        
        // Only count positive additions
        if (netLinesAdded > 0) {
            addedLines += netLinesAdded;
        }
    }
    
    return addedLines;
}

/**
 * Check if a file should be excluded from tracking based on patterns
 */
export function isExcludedFile(filePath: string, excludePatterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fileName = path.basename(normalizedPath);
    
    for (const pattern of excludePatterns) {
        // Check if the pattern matches the file path or name
        if (
            minimatch(normalizedPath, pattern) || 
            minimatch(fileName, pattern)
        ) {
            return true;
        }
    }
    
    return false;
}
