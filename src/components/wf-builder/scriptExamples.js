/**
 * Script Examples for Workflow Engine
 * These examples show how to write JavaScript code for the Script node
 */

// Example 1: Simple calculation and logging
// Available variables: variables, jobResults, utils
// Available functions: log, fetch, setTimeout, Math, Date, JSON

// Example: Basic calculation
const result = Math.random() * 100;
log(`Generated random number: ${result}`);

// Example: Working with job results from previous nodes
if (jobResults.start_result) {
  log(`Start node result: ${JSON.stringify(jobResults.start_result)}`);
}

// Example: Setting variables for next nodes
variables.calculatedValue = result;
variables.timestamp = new Date().toISOString();

// Example: Async operation with fetch
/*
const apiResponse = await fetch('https://api.example.com/data');
const data = await apiResponse.json();
log(`API Response: ${JSON.stringify(data)}`);
*/

// Example: Conditional logic
if (result > 50) {
  log("High value detected");
  variables.category = "high";
} else {
  log("Low value detected");
  variables.category = "low";
}

// Return a result (optional)
return {
  success: true,
  value: result,
  category: variables.category,
  message: "Script executed successfully"
};
