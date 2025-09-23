/**
 * Converts an array of objects to a CSV-formatted string and triggers a browser download.
 * Handles nested arrays by joining them with a semicolon.
 * Correctly escapes quotes and wraps cells containing commas, quotes, or newlines.
 * @param filename - The name of the file to be downloaded (e.g., "report.csv").
 * @param rows - An array of objects to be converted to CSV. Each object represents a row.
 */
export const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) {
    alert("No data available to export.");
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  // Create the CSV header row
  const csvHeader = keys.join(separator);
  
  // Create the CSV content rows
  const csvRows = rows.map(row => {
    return keys.map(k => {
      let cell = row[k] === null || row[k] === undefined ? '' : row[k];
      
      // Handle array data by joining with a semicolon
      if (Array.isArray(cell)) {
        cell = cell.join('; ');
      }
      
      // Handle Date objects
      cell = cell instanceof Date
        ? cell.toLocaleString()
        : cell.toString();
        
      // Escape double quotes by doubling them
      cell = cell.replace(/"/g, '""');

      // If the cell contains a comma, a double quote, or a newline, wrap it in double quotes.
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(separator);
  }).join('\n');

  // Combine header and rows
  const csvContent = `${csvHeader}\n${csvRows}`;

  // Create a Blob and trigger the download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
