import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ThresholdValues } from './detector';

export class Logger {
    private logFilePath: string;
    private lastTimingSinceLastInsert: number | null = null;
    
    constructor(storagePath: string) {
        // Get custom log file path from settings or use default
        const config = vscode.workspace.getConfiguration('genailoc');
        const customPath = config.get<string>('logFilePath', '');
        
        if (customPath) {
            this.logFilePath = customPath;
        } else {
            this.logFilePath = path.join(storagePath, 'loc-tracking.csv');
        }
        
        this.ensureLogFileExists();
    }
    
    /**
     * Log a line of code addition to the CSV file
     */
    public logAddition(
        timestamp: string, 
        userId: string, 
        filePath: string, 
        linesAdded: number, 
        source: string,
        thresholds: ThresholdValues
    ): void {
        // Sanitize values for CSV
        const sanitizedFilePath = filePath.replace(/,/g, '_');
        const sanitizedSource = source.replace(/,/g, '_');
        
        
        // Format actual values (may be undefined)
        const actualLinesAdded = thresholds.actualLinesAdded !== undefined 
            ? thresholds.actualLinesAdded 
            : 'N/A';
        const actualCharsAdded = thresholds.actualCharsAdded !== undefined 
            ? thresholds.actualCharsAdded 
            : 'N/A';
        const actualTimingSinceLastInsert = thresholds.actualTimingSinceLastInsert !== undefined 
            ? thresholds.actualTimingSinceLastInsert 
            : 'N/A';
        
        // Calculate time difference between current and previous timing
        let timeDifference = 'N/A';
        if (thresholds.actualTimingSinceLastInsert !== undefined && this.lastTimingSinceLastInsert !== null) {
            const diff = thresholds.actualTimingSinceLastInsert - this.lastTimingSinceLastInsert;
            timeDifference = diff.toString();
        }
        
        // Store the current timing for next calculation
        if (thresholds.actualTimingSinceLastInsert !== undefined) {
            this.lastTimingSinceLastInsert = thresholds.actualTimingSinceLastInsert;
        }
        
        // Get the reason from thresholds
        const reason = thresholds.reason !== undefined ? thresholds.reason : 'N/A';
        
        const entry = `${timestamp},${userId},${sanitizedFilePath},${linesAdded},${sanitizedSource},` +
                      `${actualLinesAdded},${actualCharsAdded},${actualTimingSinceLastInsert},${timeDifference},${reason}\n`;
        
        try {
            fs.appendFileSync(this.logFilePath, entry);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to log LOC: ${error}`);
        }
    }
    
    /**
     * Ensure the log file exists, create it with headers if it doesn't
     */
    private ensureLogFileExists(): void {
        try {
            const dirPath = path.dirname(this.logFilePath);
            
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            
            if (!fs.existsSync(this.logFilePath)) {
                fs.writeFileSync(this.logFilePath, 
                    'timestamp,user_id,file_path,lines_added,source,' +
                    'actual_lines_added,actual_chars_added,actual_timing_since_last_insert,time_difference_since_previous,reason\n');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create log file: ${error}`);
        }
    }
}
