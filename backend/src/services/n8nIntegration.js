// n8n Integration Module for Building Budget Application

/**
 * This module provides integration with n8n workflow for processing files
 * and generating budgets in the Building Budget application.
 * 
 * It includes functions for:
 * - Sending files to n8n for processing
 * - Receiving extracted data from n8n
 * - Triggering budget generation workflows
 */

// Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.example.com';
const N8N_API_KEY = process.env.N8N_API_KEY || 'your-n8n-api-key';
const N8N_WORKFLOW_IDS = {
  FILE_PROCESSING: 'file-processing-workflow-id',
  BUDGET_GENERATION: 'budget-generation-workflow-id'
};

// Dependencies
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Send a file to n8n for processing
 * @param {Object} file - File object with path and metadata
 * @param {Object} project - Project object the file belongs to
 * @returns {Promise<Object>} - Processing job information
 */
async function sendFileForProcessing(file, project) {
  try {
    const formData = new FormData();
    
    // Add file
    formData.append('file', fs.createReadStream(file.file_path), {
      filename: file.original_name,
      contentType: getContentType(file.file_type)
    });
    
    // Add metadata
    formData.append('fileId', file.id);
    formData.append('fileType', file.file_type);
    formData.append('projectId', project.id);
    formData.append('projectName', project.name);
    formData.append('buildingType', project.building_type);
    
    // Send to n8n
    const response = await axios.post(
      `${N8N_BASE_URL}/webhook/${N8N_WORKFLOW_IDS.FILE_PROCESSING}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-N8N-API-KEY': N8N_API_KEY
        }
      }
    );
    
    return {
      jobId: response.data.jobId,
      status: 'processing',
      message: 'File sent for processing'
    };
  } catch (error) {
    console.error('Error sending file to n8n:', error);
    throw new Error('Failed to send file for processing');
  }
}

/**
 * Receive extracted data from n8n
 * @param {Object} data - Extracted data from n8n
 * @returns {Promise<Object>} - Saved extracted data
 */
async function receiveExtractedData(data) {
  try {
    // Validate required fields
    if (!data.fileId || !data.extractedData) {
      throw new Error('Missing required fields in extracted data');
    }
    
    // Process and save extracted data
    // This would typically involve saving to database
    console.log('Received extracted data for file:', data.fileId);
    
    return {
      status: 'success',
      message: 'Extracted data received and saved',
      fileId: data.fileId,
      dataCount: Array.isArray(data.extractedData) ? data.extractedData.length : 1
    };
  } catch (error) {
    console.error('Error processing extracted data:', error);
    throw new Error('Failed to process extracted data');
  }
}

/**
 * Trigger budget generation workflow in n8n
 * @param {Object} project - Project object
 * @param {Array} files - Array of file objects
 * @returns {Promise<Object>} - Budget generation job information
 */
async function triggerBudgetGeneration(project, files) {
  try {
    // Prepare data for n8n
    const payload = {
      projectId: project.id,
      projectName: project.name,
      buildingType: project.building_type,
      totalArea: project.total_area,
      files: files.map(file => ({
        id: file.id,
        type: file.file_type,
        name: file.original_name
      }))
    };
    
    // Send to n8n
    const response = await axios.post(
      `${N8N_BASE_URL}/webhook/${N8N_WORKFLOW_IDS.BUDGET_GENERATION}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': N8N_API_KEY
        }
      }
    );
    
    return {
      jobId: response.data.jobId,
      status: 'processing',
      message: 'Budget generation started'
    };
  } catch (error) {
    console.error('Error triggering budget generation:', error);
    throw new Error('Failed to trigger budget generation');
  }
}

/**
 * Check status of a processing job in n8n
 * @param {string} jobId - Job ID to check
 * @returns {Promise<Object>} - Job status information
 */
async function checkJobStatus(jobId) {
  try {
    const response = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions/${jobId}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      }
    );
    
    return {
      jobId,
      status: response.data.status,
      finished: response.data.finished,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error checking job status:', error);
    throw new Error('Failed to check job status');
  }
}

/**
 * Get content type based on file type
 * @param {string} fileType - File type (pdf, dwg, ifc)
 * @returns {string} - Content type
 */
function getContentType(fileType) {
  const contentTypes = {
    pdf: 'application/pdf',
    dwg: 'application/acad',
    ifc: 'application/x-step'
  };
  
  return contentTypes[fileType] || 'application/octet-stream';
}

module.exports = {
  sendFileForProcessing,
  receiveExtractedData,
  triggerBudgetGeneration,
  checkJobStatus
};
