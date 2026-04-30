/**
 * Parse CSV file and return array of objects
 */
export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n").filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }

        // Parse header
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().toLowerCase());
        const requiredHeaders = ["task name", "assigned user", "deadline"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          reject(
            new Error(
              `Missing required columns: ${missingHeaders.join(", ")}`
            )
          );
          return;
        }

        // Parse rows
        const tasks = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values.every((v) => !v)) continue; // Skip empty rows

          const task = {};
          headers.forEach((header, index) => {
            const key = headerToKey(header);
            task[key] = values[index] || null;
          });

          // Validate
          const validationError = validateTaskRow(task, i + 1);
          if (validationError) {
            task._error = validationError;
          }

          tasks.push(task);
        }

        if (tasks.length === 0) {
          reject(new Error("No valid task rows found in CSV"));
          return;
        }

        resolve(tasks);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

/**
 * Convert CSV header to camelCase key
 */
const headerToKey = (header) => {
  const keyMap = {
    "task name": "title",
    "task title": "title",
    description: "description",
    "assigned user": "assignedUser",
    "assigned to": "assignedUser",
    deadline: "deadline",
    type: "type",
    status: "status",
  };
  return keyMap[header] || header.replace(/\s+/g, "_");
};

/**
 * Validate a task row
 */
const validateTaskRow = (task, rowNumber) => {
  const errors = [];

  if (!task.title) {
    errors.push("Task name is required");
  }

  if (!task.assignedUser) {
    errors.push("Assigned user is required");
  }

  if (!task.deadline) {
    errors.push("Deadline is required");
  } else if (!isValidDate(task.deadline)) {
    errors.push(`Invalid deadline format: "${task.deadline}". Use YYYY-MM-DD`);
  }

  if (task.type && !["Bug", "Task"].includes(task.type)) {
    errors.push(`Invalid type: "${task.type}". Must be "Bug" or "Task"`);
  }

  return errors.length > 0 ? `Row ${rowNumber}: ${errors.join("; ")}` : null;
};

/**
 * Check if date string is valid (YYYY-MM-DD)
 */
export const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

/**
 * Generate CSV template
 */
export const generateCSVTemplate = () => {
  const headers = [
    "Task Name",
    "Description",
    "Assigned User",
    "Deadline",
    "Type",
  ];
  const example = [
    "Fix login bug",
    "Users can't login with Google",
    "john@example.com",
    "2024-05-15",
    "Bug",
  ];

  return `${headers.join(",")}\n${example.join(",")}`;
};

/**
 * Download CSV template
 */
export const downloadCSVTemplate = () => {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tasks_template.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
