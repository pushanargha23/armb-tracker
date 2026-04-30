/**
 * Firebase Cloud Functions Entry Point
 * 
 * Exports all Cloud Functions for ARMB Tracker
 */

const dailyReport = require("./dailyReport");

// Daily Work Report Email Function
exports.sendDailyReport = dailyReport.sendDailyReport;
