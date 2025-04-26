/**
 * GenAI LOC Tracker Extension
 * 
 * This extension tracks lines of code (LOC) added to files in a workspace,
 * with a focus on detecting and logging code that may have been generated
 * by AI tools. It monitors document changes, analyzes added content,
 * and logs statistics for further analysis.
 */

// Import VS Code API for extension functionality
import * as vscode from 'vscode';
// Import OS module for user information
import * as os from 'os';
// Import path module for file path operations
import * as path from 'path';
// Import custom logger for tracking code additions
import { Logger } from './logger';
// Import detection utilities for identifying AI-generated code
import { detectSource, getThresholdValues } from './detector';
// Import utility functions for counting lines and filtering files
import { countAddedLines, isExcludedFile } from './utils';


/**
 * Extension activation point - called when the extension is activated
 * @param context The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('GenAI LOC Tracker is now active');

    // Initialize the logger with the extension's storage path for persistent logging
    const logger = new Logger(context.globalStoragePath);


    // Register a listener for document change events to track code additions
    const disposable = vscode.workspace.onDidChangeTextDocument(event => {
        // Check if tracking is enabled in the extension settings
        const config = vscode.workspace.getConfiguration('genailoc');
        if (!config.get<boolean>('enabled', true)) {
            return; // Exit early if tracking is disabled
        }

        // Skip processing for excluded file types (e.g., binary files, images)
        if (isExcludedFile(event.document.fileName, config.get<string[]>('excludedFileTypes', []))) {
            return; // Exit early if the file type is in the exclusion list
        }

        // Count the number of lines added in this document change event
        const addedLines = countAddedLines(event);
        if (addedLines > 0) {
            // Detect the likely source of the added code (human, AI, etc.)
            const source = detectSource(event);
            
            // Get threshold values used for detection and the actual detected metrics
            const thresholds = getThresholdValues(source, event);
            
            // Log the code addition with all relevant metadata:
            // - Timestamp
            // - Username
            // - File path
            // - Number of lines added
            // - Detected source
            // - Detection threshold values
            logger.logAddition(
                new Date().toISOString(),
                os.userInfo().username,
                event.document.fileName,
                addedLines,
                source,
                thresholds
            );
        }
    });
    
    // Add the event listener to the extension's subscriptions for proper cleanup
    context.subscriptions.push(disposable);
}

/**
 * Extension deactivation handler - called when the extension is deactivated
 * This happens when VS Code is closed or when the extension is disabled
 */

export function deactivate() {
    console.log('GenAI LOC Tracker is now deactivated');
    // No specific cleanup needed as the extension context handles disposal of subscriptions
}
