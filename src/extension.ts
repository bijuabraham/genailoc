import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { Logger } from './logger';
import { detectSource, getThresholdValues } from './detector';
import { countAddedLines, isExcludedFile } from './utils';


export function activate(context: vscode.ExtensionContext) {
    console.log('GenAI LOC Tracker is now active');

    // Initialize the logger
    const logger = new Logger(context.globalStoragePath);


    // Register document change listener
    const disposable = vscode.workspace.onDidChangeTextDocument(event => {
        // Check if tracking is enabled
        const config = vscode.workspace.getConfiguration('genailoc');
        if (!config.get<boolean>('enabled', true)) {
            return;
        }

        // Skip excluded file types
        if (isExcludedFile(event.document.fileName, config.get<string[]>('excludedFileTypes', []))) {
            return;
        }

        // Process document changes
        const addedLines = countAddedLines(event);
        if (addedLines > 0) {
            // Detect source
            const source = detectSource(event);
            
            // Get threshold values and actual detected values for the detected source
            const thresholds = getThresholdValues(source, event);
            
            // Log the addition with threshold values
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
    
    context.subscriptions.push(disposable);
}


export function deactivate() {
    console.log('GenAI LOC Tracker is now deactivated');
}
